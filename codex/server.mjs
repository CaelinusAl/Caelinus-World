// CAELINUS CODEX — zero-dependency static server (portable / handoff-safe).
// Serves /codex/* from the codex folder and /asset/* from the resolved
// ASSET_DIR (images live on a local path, outside git). Works wherever codex/
// is dropped, on any repo root.
//   node codex/server.mjs   → http://localhost:4173/codex/web/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODEX_ROOT, ASSET_DIR } from './engine/config.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // parent of /codex
const PORT = Number(process.env.CODEX_PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
};
const serve = (res, filePath) => {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
};

http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/codex/web/index.html';
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    // /asset/* → local ASSET_DIR (images outside the repo)
    if (urlPath.startsWith('/asset/')) {
      const f = path.join(ASSET_DIR, urlPath.slice('/asset/'.length));
      if (!path.resolve(f).startsWith(path.resolve(ASSET_DIR))) { res.writeHead(403).end(); return; }
      return serve(res, f);
    }
    // /codex/* → codex folder;  anything else → repo root
    const base = urlPath.startsWith('/codex/') ? path.dirname(CODEX_ROOT) : REPO_ROOT;
    const filePath = path.join(base, urlPath);
    if (!path.resolve(filePath).startsWith(path.resolve(base))) { res.writeHead(403).end('forbidden'); return; }
    serve(res, filePath);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('error: ' + e.message);
  }
}).listen(PORT, () => {
  console.log(`CAELINUS CODEX → http://localhost:${PORT}/codex/web/`);
  console.log(`  assets ← ${ASSET_DIR}`);
});
