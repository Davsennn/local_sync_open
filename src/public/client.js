(async () => {
  window.addEventListener('load', () => {
    // Is service worker available?
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service worker registered!');
      }).catch((error) => {
        console.warn('Error registering service worker:');
        console.warn(error);
      });
    }
  });

  const config = await fetch('config.json').then(res => res.json());

  const showDebug = config.showDebug || false;


  console.log('client.js loaded');
  document.addEventListener('DOMContentLoaded', () => {
    const debug = document.createElement('div');
    debug.id = 'debug';
    debug.style.position = 'fixed';
    debug.style.bottom = '0';
    debug.style.left = '0';
    debug.style.background = 'rgba(0,0,0,0.8)';
    debug.style.color = showDebug ? 'lime' : 'black';
    debug.style.padding = '10px';
    debug.style.fontSize = '14px';
    debug.style.fontFamily = 'monospace';
    debug.style.zIndex = showDebug ? '9999' : '0';
    debug.style.maxWidth = '100%';
    debug.style.maxHeight = '50%';
    debug.style.overflowY = 'auto';
    debug.textContent = '[Debug started]';
    document.body.appendChild(debug);

    window.logDebug = (msg) => {
      if (!showDebug) return;
      console.log(msg);
      ws.send(JSON.stringify({ type: 'log', msg }));
      debug.textContent += '\n ' + msg;
      debug.scrollTop = debug.scrollHeight;
    };
  });

  let latency = 0;
  let seekLatency = 0;

  const safeLog = (msg) => {
    if (typeof logDebug === 'function' && ws.readyState === ws.OPEN) logDebug(msg)
    else if (ws.readyState !== ws.OPEN) console.log(`[SAFE LOG] ${msg}`);
    else setTimeout(() => safeLog(msg), 200);
  };

  window.onerror = function (msg, src, line, col, err) {
    safeLog(`JS Error: ${msg} @${src}:${line}:${col}`);
    return false;
  };

  const ws = new WebSocket(`wss://${location.host}`);
  const video = document.getElementById('video');
  document.getElementById('overlay');

  const initialClipIndex = config.initialClipIndex || 0;
  let currentClip = initialClipIndex;
  const clipsPath = config.clipsPath || "clips/";

  function loadClip(index) {
    currentClip = index;
    video.src = `${clipsPath}${currentClip}.mp4`;
    video.load();
    if (config.autoPlayOnLoad) {
      video.play().catch(err => safeLog(`Autoplay failed: ${err.message}`));
    }
  }

  video.addEventListener('DOMContentLoaded', () => loadClip(currentClip) );

  video.addEventListener('error', e => {
    safeLog('Video error:', video.error);
  });

  video.addEventListener('loadeddata', () => safeLog('Video is loaded'));
  video.addEventListener('error', () => safeLog(`Video error: code ${video.error?.code}`));
  video.addEventListener('play', () => safeLog('Video is playing'));
  video.addEventListener('pause', () => safeLog('Video is paused'));

  video.playsInline = true; // crucial for iOS
  video.style.display = "inline";
  loadClip(currentClip);           // sometimes needed

  document.addEventListener('click', () => {
    try {
      video.play(); // first!
      safeLog('Video autoplayed on click');
      video.pause();
    } catch (err) {
      safeLog('Autoplay failed: ' + err.message);
    }

    if (config.useDocumentOverVideoFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        safeLog(`Fullscreen request failed: ${err.message}`);
      });
    } else {
      video.requestFullscreen().catch(err => {
        safeLog(`Fullscreen request failed: ${err.message}`);
      });
    }
  }, { once: true });

  const log = msg => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'log', msg }));

  ws.onmessage = async msg => {
    let data;
    try {
      data = JSON.parse(msg.data);
    } catch (e) {
      return;
    }
    const { type, time } = data;

    switch (type) {
      case 'next': if (currentClip !== config.finalClipIndex) {loadClip(currentClip + 1); video.play(); } break;
      case 'prev': if (currentClip !== initialClipIndex) { loadClip(currentClip - 1); video.play(); } break;
      case 'black': video.style.display = (video.style.display === 'none') ? 'inline' : 'none'; break;
      case 'first': loadClip(initialClipIndex);
      case 'play':
        if (config.useSyncingLogic) video.currentTime += latency + seekLatency;
        video.play(); break;
      case 'pause': video.pause(); break;
      case 'seek':
        if (typeof time === 'number') {
          loadClip(time); 
          video.currentTime = config.useSyncingLogic ? latency + seekLatency : 0;
        } break;
      case 'test_seek':
        const then = performance.now();
        video.currentTime += 1;
        video.play();
        const now = performance.now();
        log( `SeekLatency measured to be ${now - then} ms`)
        log (`Latency is ${latency}`);
        log( `Calculate time + latency + seekLatency = ${latency + seekLatency}`);
        seekLatency = (now - then) / 1000;
        video.pause(); video.currentTime = latency + seekLatency;
        break;
      case 'ping':  ws.send(JSON.stringify({ type: 'pong', time })); break;
      case 'latency_report':
        latency = data.time / 1000;
        log( `Latency report received, latency is ${data.time} ms, ${latency} s`);
        break;
      default: log(`[MESSAGE LOG] Client received message of type: ${data.type}`);
    }
  };

  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'cached' }));
})();
