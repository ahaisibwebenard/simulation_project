import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createDevServer } from '../scripts/dev-server.mjs';

test('the local server loads the reorganized app and protects non-app files', async () => {
  const server = createDevServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;

  try {
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert(html.includes('./src/scripts/app.js'));
    assert(html.includes('./src/styles/main.css'));
    assert(html.includes('./public/icons/icon.svg'));

    for (const [url, type] of [
      ['/src/scripts/app.js', 'text/javascript'],
      ['/src/scripts/model.js', 'text/javascript'],
      ['/src/styles/main.css', 'text/css'],
      ['/public/icons/icon.svg', 'image/svg+xml'],
    ]) {
      const response = await fetch(origin + url);
      assert.equal(response.status, 200);
      assert(response.headers.get('content-type').startsWith(type));
      assert((await response.text()).length > 0);
    }

    for (const url of ['/package.json', '/.vscode/settings.json', '/tests/model.test.js', '/src/missing.js', '/src/%2e%2e%2fpackage.json']) {
      assert.equal((await fetch(origin + url)).status, 404);
    }
    assert.equal((await fetch(origin + '/src/%')).status, 400);
    assert.equal((await fetch(origin, { method: 'POST' })).status, 405);
    const head = await fetch(origin, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  } finally {
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
  }
});
