const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');
const url = 'https://github.com/XTLS/Xray-core/releases/download/v25.10.15/Xray-linux-64.zip';
const zip = path.join(__dirname, 'xray.zip');
const bin = path.join(__dirname, 'web-worker');
function get(u, file) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(file);
    https.get(u, { headers: { 'User-Agent': 'setup' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        f.close(); try { fs.unlinkSync(file); } catch (e) {}
        return get(res.headers.location, file).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      res.pipe(f); f.on('finish', () => f.close(resolve));
    }).on('error', reject);
  });
}
function extractZip(zipPath, destDir) {
  // Prefer system unzip; fallback to Python zipfile (stdlib)
  try {
    execSync('unzip -o -q xray.zip', { cwd: destDir, stdio: 'inherit' });
    return;
  } catch (e) {}
  execSync('python3 - <<\'PY\'\nimport zipfile\nzipfile.ZipFile("xray.zip").extractall(".")\nPY', { cwd: destDir, stdio: 'inherit' });
}
(async () => {
  if (!fs.existsSync(bin) || !fs.existsSync(path.join(__dirname, 'geoip.dat'))) {
    await get(url, zip);
    extractZip(zip, __dirname);
    if (fs.existsSync(path.join(__dirname, 'xray'))) {
      fs.renameSync(path.join(__dirname, 'xray'), bin);
    }
    try { fs.chmodSync(bin, 0o755); } catch (e) {}
    for (const f of ['xray.zip', 'LICENSE', 'README.md']) {
      try { fs.unlinkSync(path.join(__dirname, f)); } catch (e) {}
    }
  }
  for (const f of ['geoip.dat', 'geosite.dat']) {
    if (!fs.existsSync(path.join(__dirname, f))) throw new Error('missing ' + f);
  }
  console.log('setup ok');
})().catch((e) => { console.error(e); process.exit(1); });
