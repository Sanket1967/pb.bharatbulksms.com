const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PB_VERSION = '0.22.27';
const PB_URL = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip`;
const PB_BIN = path.join(__dirname, 'pocketbase');

async function download(url, dest) {
  return new Promise((res, rej) => {
    const file = fs.createWriteStream(dest);
    https.get(url, r => { r.pipe(file); file.on('finish', () => { file.close(res); }); }).on('error', rej);
  });
}

(async () => {
  if (!fs.existsSync(PB_BIN)) {
    console.log('Downloading PocketBase...');
    await download(PB_URL, '/tmp/pb.zip');
    execSync('unzip -o /tmp/pb.zip -d ./ && chmod +x ./pocketbase');
    console.log('PocketBase downloaded');
  }
  console.log('Starting PocketBase on 0.0.0.0:8090');
  const child = spawn(PB_BIN, ['serve', '--http=0.0.0.0:8090', '--dir=./pb_data', '--publicDir=./pb_public'], { stdio: 'inherit' });
  child.on('exit', code => { console.log('PB exited', code); process.exit(code); });
})();
