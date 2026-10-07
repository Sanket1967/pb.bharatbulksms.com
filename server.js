const { execSync, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PB_VERSION = '0.22.27';
const PB_URL = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip`;
const PB_BIN = '/tmp/pocketbase';
const PB_INTERNAL_PORT = 8091;
const PUBLIC_PORT = process.env.PORT || 8090;

let pbStarted = false;

function startPB() {
  if (pbStarted) return;
  pbStarted = true;
  if (!fs.existsSync(PB_BIN)) {
    console.log('Downloading PocketBase to /tmp...');
    execSync(`curl -L -o /tmp/pb.zip "${PB_URL}" && unzip -o /tmp/pb.zip -d /tmp && chmod +x /tmp/pocketbase && rm /tmp/pb.zip`, { stdio: 'inherit' });
  }
  console.log(`Starting PocketBase on 127.0.0.1:${PB_INTERNAL_PORT}`);
  const pb = spawn(PB_BIN, ['serve', `--http=127.0.0.1:${PB_INTERNAL_PORT}`, '--dir=/tmp/pb_data', '--publicDir=./pb_public'], { stdio: 'inherit' });
  pb.on('exit', c => { console.log('PB exited', c); pbStarted = false; setTimeout(startPB, 2000); });
}

// START PROXY IMMEDIATELY - Hostinger needs this in <3 sec
const server = http.createServer((req, res) => {
  if (!pbStarted) { res.writeHead(200); return res.end('PB booting... refresh 3 sec'); }
  const opts = { hostname: '127.0.0.1', port: PB_INTERNAL_PORT, path: req.url, method: req.method, headers: req.headers };
  const proxy = http.request(opts, pRes => { res.writeHead(pRes.statusCode, pRes.headers); pRes.pipe(res); });
  proxy.on('error', () => { res.writeHead(502); res.end('PB starting...'); });
  req.pipe(proxy);
});
server.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on 0.0.0.0:${PUBLIC_PORT}`);
  startPB(); // start PB AFTER listening
});
