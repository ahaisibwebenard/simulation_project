import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

/** Serve the app on this computer. Project configuration and tests stay unserved. */
export function createDevServer() {
  return http.createServer(async (request, response) => {
    const finish = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      finish(405, 'Use GET or HEAD.');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\0')) throw new Error('Invalid path');
    } catch {
      finish(400, 'Invalid request path.');
      return;
    }

    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filename = path.resolve(projectRoot, relative);
    const inProject = filename.startsWith(projectRoot + path.sep);
    const allowed = relative === 'index.html' || relative.startsWith('src/') || relative.startsWith('public/');
    const hasHiddenPart = relative.split(/[\\/]/).some(part => part.startsWith('.'));

    if (!inProject || !allowed || hasHiddenPart) {
      finish(404, 'Page not found.');
      return;
    }

    try {
      const bytes = await readFile(filename);
      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filename)] || 'application/octet-stream',
        'Content-Length': bytes.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) {
        finish(404, 'Page not found.');
      } else {
        console.error('Could not read the requested application file.');
        finish(500, 'Unable to load file.');
      }
    }
  });
}

function startFromTerminal() {
  const args = process.argv.slice(2);
  const validArgs = args.length === 0 || (args.length === 2 && args[0] === '--port');
  const port = args.length === 2 ? Number(args[1]) : 5500;
  if (!validArgs || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Usage: npm start -- --port 5500 (port must be 1–65535).');
    process.exitCode = 1;
    return;
  }

  const server = createDevServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE'
      ? `Port ${port} is busy. Try: npm start -- --port ${port === 65535 ? 5500 : port + 1}`
      : `The local server could not start: ${error.message}`);
    process.exitCode = 1;
  });
  console.log('Starting Bunyonyi development server...');
  server.listen(port, '127.0.0.1', () => {
    console.log(`Bunyonyi development server ready at http://127.0.0.1:${port}`);
    console.log('Save your edits, then refresh the browser. Press Ctrl+C to stop.');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startFromTerminal();
}
