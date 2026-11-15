// Baut eine einzelne HTML-Datei (nur Bot-Modus, läuft ohne Server): dist/skalamala.html
const fs = require('fs'), path = require('path');
const r = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const b64 = (p, mime) => `data:${mime};base64,${fs.readFileSync(path.join(__dirname, p)).toString('base64')}`;
const app = r('public/app.js')
  .replace("const LOGO = 'logo.svg';", () => `const LOGO = '${b64('public/logo.svg', 'image/svg+xml')}';`)
  .replace("const EMBLEM = 'emblem.svg';", () => `const EMBLEM = '${b64('public/emblem.svg', 'image/svg+xml')}';`);
let html = r('public/index.html')
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${r('public/style.css')}\n</style>`)
  .replace('<script src="engine.js"></script>', () => `<script>\n${r('shared/engine.js')}\n</script>`)
  .replace('<script src="koelsch.js"></script>', () => `<script>\n${r('public/koelsch.js')}\n</script>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${app}\n</script>`)
  .replace('<link rel="manifest" href="manifest.webmanifest">\n', '')
  .replace('<link rel="apple-touch-icon" href="apple-touch-icon.png">\n', '')
  .replace('<link rel="icon" href="emblem.svg" type="image/svg+xml">', () => `<link rel="icon" href="${b64('public/emblem.svg', 'image/svg+xml')}" type="image/svg+xml">`)
  .replace('<link rel="alternate icon" href="icon-192.png" type="image/png">\n', '');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/skalamala.html'), html);
console.log('dist/skalamala.html', html.length, 'Bytes');
