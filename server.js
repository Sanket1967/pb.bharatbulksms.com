const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PB_VERSION = '0.22.27';
const PB_URL = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip`;
const PB_BIN = path.join(__dirname, 'pocketbase');

(async () => {
  if (!fs.existsSync(PB_BIN)) {
    console.log('Downloading PocketBase...');
    try {
      execSync(`curl -L -o /tmp/pb.zip "${PB_URL}" && unzip -o /tmp/pb.zip -d ./ && chmod +x ./pocketbase && rm /tmp/pb.zip`, { stdio: 'inherit' });
      console.log('PocketBase downloaded');
    } catch (e) {
      console.error('Download failed', e.message);
      process.exit(1);
    }
  }
  console.log('Starting PocketBase on 0.0.0.0:8090');
  const child = spawn(PB_BIN, ['serve', '--http=0.0.0.0:8090', '--dir=./pb_data', '--publicDir=./pb_public'], { stdio: 'inherit' });
  child.on('exit', code => { console.log('PB exited', code); process.exit(code); });
})();
