let OFFLINE_URLS = [];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/config.json');
        const config = await res.json();
        
        const clips_url = config.clipsPath;
        const start = config.initialClipIndex;
        const end = config.finalClipIndex;
        const others = config.offlineUrls || [ "/client.html", "/client.js", "/favicon.ico", "/config.json" ];
                
        for (let i = start; i <= end; i++) OFFLINE_URLS.push(`/${clips_url}${i}.mp4`);
        OFFLINE_URLS = OFFLINE_URLS.concat(others);
        
        const cache = await caches.open('static-assets');
        
        await cache.addAll(OFFLINE_URLS);
        console.log(`Service worker cached: ${OFFLINE_URLS}`);
      } catch (err) {
        console.error('SW install error:');
        console.error(err);
      }
    })()
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url).pathname;

  event.respondWith(
    caches.match(url).then(resp => resp || fetch(event.request))
  );
});
