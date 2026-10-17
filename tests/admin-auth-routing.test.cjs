const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.join(__dirname, '..');
const directAuth = 'https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-auth';
const oldGatewayAuth = 'admin-gateway?route=admin-auth';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function sources(folder) {
  return fs.readdirSync(path.join(root, folder), { withFileTypes: true }).flatMap(item => {
    const name = path.posix.join(folder, item.name);
    if (item.isDirectory()) return sources(name);
    return /\.(?:js|html)$/.test(item.name) ? [name] : [];
  });
}

test('no admin source verifies through the old Make auth gateway', () => {
  const files = [...sources('admin'), ...sources('admin-tipps')];
  assert.ok(files.length >= 25, 'Admin sources not found: incomplete checkout');
  for (const file of files) {
    const content = read(file);
    assert.ok(!content.includes(oldGatewayAuth), file + ' still calls the old Make auth gateway');
    assert.ok(!/adminGateway\s*\+\s*['"]admin-auth['"]/.test(content), file + ' maps auth to Make');
    assert.ok(!/AUTH_API_URL\s*=\s*['"]https:\/\/hook\.eu1\.make\.com\//.test(content), file + ' calls Make directly for auth');
  }
});

test('core entry points validate the same Supabase admin session', () => {
  const secured = [
    'admin/index.html',
    'admin/backoffice/index-core-20260905.html',
    'admin/backoffice/kosten/index.html',
    'admin/performance/index.html',
    'admin/system-monitor/index.html',
    'admin/user-zugang/index.html',
    'admin-tipps/historisch/index.html',
    'admin-tipps/verwalten/index.html'
  ];
  for (const file of secured) {
    assert.ok(read(file).includes(directAuth), file + ' is not routed to canonical auth');
  }
});

test('current compressed tip terminal maps its auth endpoint to Supabase', () => {
  const encoded = [0,1,2,3].map(i=>read('admin-tipps/livev11.part'+i).trim()).join('');
  const raw = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
  const match = raw.match(/const\s+AUTH_API_URL\s*=\s*['"]([^'"]+)['"]/);
  assert.ok(match, 'Compressed terminal has no identifiable AUTH_API_URL');
  const currentAuth = match[1];
  for (const loader of ['admin-tipps/index.html','admin-tipps/laliga2.html']) {
    const html = read(loader);
    if (currentAuth !== directAuth) {
      assert.ok(html.includes("'" + currentAuth + "':'" + directAuth + "'"), loader + ' does not rewrite compressed legacy auth');
      assert.ok(html.includes('html.split(legacyUrl).join(secureUrl)'), loader + ' does not apply the secure URL mapping');
    }
  }
});

test('Admin Center points to the protected tip loader', () => {
  assert.match(read('admin/index.html'), /href="\/admin-tipps\/laliga2\.html\?v=/);
});
