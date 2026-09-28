const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const guard = fs.readFileSync(path.join(root, 'assets/tip-expiry-guard.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'tipps/index.html'), 'utf8');
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

function fixture() {
  let now = Date.parse('2026-09-27T16:29:00Z'), unlocks = 0, fail = false;
  const timers = [];
  const kickoff = now + 60000;
  const button = { dataset: {}, style: {}, disabled: false };
  const note = { textContent: '' }, result = { textContent: '', innerHTML: '' };
  const card = { isConnected: false, hidden: false, dataset: {}, style: {},
    querySelector: s => ({ '.unlock-button': button, '.small-note': note, '.unlock-result': result })[s],
    remove() { this.isConnected = false; } };
  class Clock extends Date { static now() { return now; } }
  const ctx = { URL, Date: Clock, console: { warn() {} },
    location: { pathname: '/tipps/', href: 'https://app.betinsight.club/tipps/' },
    document: { currentScript: { src: 'https://app.betinsight.club/assets/tip-expiry-guard.js' }, querySelector: () => null },
    fetch: async () => { if (fail) throw Error('offline'); return { ok: true, json: async () => ({ tips: [{ tipp_id: 'test', kickoff_at: new Date(kickoff).toISOString() }] }) }; }
  };
  ctx.window = { createOpenTipCard: () => card, freischalten: async () => { unlocks++; },
    setTimeout: (fn, delay) => timers.push({ fn, at: now + delay }) };
  vm.runInNewContext(guard, ctx);
  return { ctx, card, button, kickoff, get unlocks() { return unlocks; },
    offline() { fail = true; }, setTime(t) { now = t; },
    create(expired = false) { const c = ctx.window.createOpenTipCard({ tipp_id: 'test', expired }); c.isConnected = true; return c; },
    async tick(t) { now = t; let i; while ((i = timers.findIndex(timer => timer.at <= now)) >= 0) { timers.splice(i, 1)[0].fn(); await flush(); } },
    unlock() { return ctx.window.freischalten('test', card, button); }
  };
}

test('already-expired card is hidden and disabled before insertion, then removed', async () => {
  for (const flag of [true, 'true', ' TRUE ', 1, '1']) {
    const f = fixture(); f.create(flag);
    assert.equal(f.card.hidden, true); assert.equal(f.card.style.display, 'none');
    assert.equal(f.button.disabled, true);
    await f.unlock(); assert.equal(f.unlocks, 0);
    await f.tick(f.kickoff); assert.equal(f.card.isConnected, false);
  }
});
test('open page removes a future tip automatically at kickoff', async () => {
  const f = fixture(); f.create(); await flush();
  assert.equal(f.card.hidden, false); assert.equal(f.button.disabled, false);
  await f.tick(f.kickoff + 120);
  assert.equal(f.card.isConnected, false); assert.equal(f.button.disabled, true);
});
test('stale API flag is overridden by the static kickoff timestamp', async () => {
  const f = fixture(); f.setTime(f.kickoff + 1); f.create(false); await flush();
  assert.equal(f.card.hidden, true); assert.equal(f.button.disabled, true);
});
test('suspended timer and failed status refresh cannot allow a known expired tip', async () => {
  const f = fixture(); f.create(); await flush(); f.offline(); f.setTime(f.kickoff);
  await f.unlock(); assert.equal(f.unlocks, 0); assert.equal(f.button.disabled, true);
});
test('crossing kickoff during status fetch cannot call unlock', async () => {
  const f = fixture(); f.create(); await flush();
  const pending = f.unlock(); f.setTime(f.kickoff); await pending;
  assert.equal(f.unlocks, 0); assert.equal(f.button.disabled, true);
});
test('valid future tip still reaches the existing unlock flow', async () => {
  const f = fixture(); f.create(); await flush(); await f.unlock();
  assert.equal(f.unlocks, 1);
});
test('main list excludes expired tips even if the helper or results service fails', async () => {
  const nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, { style: {}, innerHTML: '', addEventListener() {} }); return nodes.get(id); };
  const tips = [true, 'true', ' TRUE ', 1, '1'].map((expired, i) => ({ tipp_id: 'expired' + i, expired }));
  tips.push({ tipp_id: 'future', expired: false });
  const context = vm.createContext({ console, document: { getElementById: node, addEventListener() {} }, window: { addEventListener() {} },
    fetch: async url => ({ ok: url.includes('tips-list'), text: async () => url.includes('tips-list') ? JSON.stringify(tips) : 'unavailable' }) });
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(match[1], context);
  vm.runInContext('renderNextOpenTipps=()=>{};renderResults=()=>{};appendDemoCard=()=>{};', context);
  await vm.runInContext('loadPage()', context);
  assert.equal(vm.runInContext('JSON.stringify(loadedOpenTipps.map(t=>t.tipp_id))', context), '["future"]');
});
