import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import viteConfig from '../../vite.config.js';

test('로컬 설정 프록시는 지정된 공개 파일만 읽고 인증 헤더를 전달하지 않는다', () => {
  const [pattern, proxy] = Object.entries(viteConfig.server.proxy)[0];
  const match = new RegExp(pattern);
  assert.equal(match.test('/event-config.json?v=1'), true);
  assert.equal(match.test('/event-config.json/other'), false);
  assert.equal(proxy.target, 'https://storage.googleapis.com');
  assert.equal(proxy.rewrite('/event-config.json?v=1'), '/katsu-map-images/app-config/events.json?v=1');
  let handler;
  proxy.configure({ on: (name, callback) => { assert.equal(name, 'proxyReq'); handler = callback; } });
  const removed = []; handler({ removeHeader: (name) => removed.push(name) });
  assert.deepEqual(removed, ['authorization', 'cookie']);
});
test('배포 설정은 HTML fallback보다 먼저 공개 설정을 연결하고 캐시하지 않는다', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.rewrites[0], { source: '/event-config.json', destination: 'https://storage.googleapis.com/katsu-map-images/app-config/events.json' });
  assert.equal(config.rewrites.at(-1).destination, '/index.html');
  assert.equal(config.headers.find(rule => rule.source === '/event-config.json').headers.find(header => header.key === 'Cache-Control').value, 'no-store, max-age=0');
});
