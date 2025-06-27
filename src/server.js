const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'config.json')));
const PORT = config.port || 8080;
const app = express();
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

app.use((req, res, next) => {
  if (req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

let clients = new Map();

function logEntry(data) {
  return `[${new Date().toISOString()}] Command: ${data.type}${data.time !== undefined ? ` @${data.time}s` : ''}`;
}

function broadcast(json) {
  clients.keys().forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

function log(msg, relay) {
  if (relay) clients.keys().forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ type: 'log_entry', msg })) });
  console.log(msg);
}

function ping(client) { client.send(JSON.stringify({ type: 'ping', time: performance.now() })); console.log("[MESSAGE LOG] Starting ping...") }

wss.on('connection', (ws) => {
  log("[CLIENT LOG] Connection established", true);
  ws.cached = false;
  clients.set(ws, new Set());

  // Start pinging
  ping(ws);
  // Send update to control page
  // ws.send(JSON.stringify({ type: 'clients_info', time: clients.keys().toArray().length }))

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      return;
    }

    log(`[MESSAGE LOG] Message of type ${data.type} received${data.time !== undefined ? ` @${data.time}s`:""}`);

    switch (data.type) {
      case 'pong': {
        const now = performance.now();
        if (now < data.time + 1) return; // latency sanity check
        clients.get(ws).add((now - data.time) / 2);
        console.log("[MESSAGE LOG] Pong received at ", (now - data.time) / 2, clients.get(ws).size);
        if (clients.get(ws).size < 10) ping(ws);
        else {
          let avgLatency = 0;
          clients.get(ws).forEach( value => avgLatency += value );
          console.log(avgLatency / clients.get(ws).size);
          ws.send(JSON.stringify({ type: 'latency_report', time: avgLatency / clients.get(ws).size }))
        }
        break;
      }
      case 'cached': ws.cached = true; break;
      case 'test_seek': broadcast(JSON.stringify({ type: 'test_seek' })); break;
      case 'log': { if (typeof data.msg === 'string') log(`[CLIENT LOG] ${data.msg}`, false); break; }
      default: {
        if (["play", "pause", "seek", "next", "prev", "first", "black"].includes(data.type)) {
          const entry = logEntry(data);
          broadcast(JSON.stringify(data));
          log(entry, true);
        } else { log(`[ERROR] Unknown message type: ${data.type}`, true); }
      }
    }
  });

  ws.on('close', () => clients.delete(ws));
});

app.get('/cached-count', (req, res) => {
  const count = [...clients.keys()].filter(c => c.cached).length;
  res.json({ count });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
