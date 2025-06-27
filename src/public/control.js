const ws = new WebSocket(`wss://${location.host}`);
const logBox = document.getElementById('log');
let clientCount = 0;
function log(msg) {
  logBox.textContent += `[${new Date().toISOString()}] ${msg} \n`;
  logBox.scrollTop = logBox.scrollHeight;
}

function send(type, value) {
  if (type === 'seek' && (typeof value !== 'number' || isNaN(value))) return;
  ws.send(JSON.stringify({ type, time: value }));
}

function readableReadyState() {
  switch (ws.readyState) {
    case ws.OPEN: return "OPEN";
    case ws.CLOSED: return "CLOSED";
    case ws.CLOSING: return "CLOSING";
    case ws.CONNECTING: return "CONNECTING";
    default: return "null";
  }
}

ws.onmessage = (msg) => {
  let data;
  try {
    data = JSON.parse(msg.data);
  } catch (e) {
    log(e.toString());
    return;
  }
  switch (data.type) {
    case 'log_entry': log(data.msg); break;
    /* case 'clients_info': {
      clientCount = data.time;
      document.getElementById('cachedCount').textContent = `Cached Clients: ${clientCount}`;
      break;
    } */
    default: log(`[MESSAGE LOG] Control received message of type: ${data.type}`);
  }
};