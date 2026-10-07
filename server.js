const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PB_VERSION = '0.22.27';
const PB_URL = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip`;
const PB_BIN = path.join(__dirname, 'pocketbase');
const PB_INTERNAL_PORT = 8091;
const PUBLIC_PORT = 8090;

// 1. Download PB if needed
if (!fs.existsSync(PB_BIN)) {
  console.log('Downloading PocketBase...');
  execSync(`curl -L -o /tmp/pb.zip "${PB_URL}" && unzip -o /tmp/pb.zip -d ./ && chmod +x ./pocketbase && rm /tmp/pb.zip`, { stdio: 'inherit' });
  console.log('PocketBase downloaded');
}

// 2. Start PB on internal port 8091
console.log(`Starting PocketBase internally on 127.0.0.1:${PB_INTERNAL_PORT}`);
const pb = spawn(PB_BIN, ['serve', `--http=127.0.0.1:${PB_INTERNAL_PORT}`, '--dir=./pb_data', '--publicDir=./pb_public'], { stdio: 'inherit' });

// 3. Proxy server that Hostinger WILL detect - listens immediately
const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: PB_INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(options, (pRes) => {
    res.writeHead(pRes.statusCode, pRes.headers);
    pRes.pipe(res, { end: true });
  });
  proxy.on('error', (e) => {
    res.writeHead(502); res.end('PB starting... refresh in 2 sec');
  });
  req.pipe(proxy, { end: true });
});

server.on('upgrade', (req, socket, head) => {
  const options = {
    hostname: '127.0.0.1',
    port: PB_INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(options);
  proxy.on('upgrade', (pRes, pSocket, pHead) => {
    socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' + 'Upgrade: websocket\r\n' + 'Connection: Upgrade\r\n' + '\r\n');
    pSocket.pipe(socket); socket.pipe(pSocket);
  });
  proxy.end();
});

server.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on 0.0.0.0:${PUBLIC_PORT} -> 127.0.0.1:${PB_INTERNAL_PORT}`);
});
