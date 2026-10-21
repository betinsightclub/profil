import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const base = json('assets/provider-whitelist.json');
const manifest = json('assets/provider-whitelist-batches.json');
assert.equal(manifest.files.length, 93, 'expected 92 immutable historical batches + one overlay');
assert.equal(manifest.files.at(-1), 'provider-whitelist-web-batch-93.json');
const overlay = json('assets/provider-whitelist-web-batch-93.json');
assert.equal(overlay.country_rules.DE.providers.length, 31);
assert.equal(new Set(overlay.country_rules.DE.providers.map(p=>p.name)).size,31);
assert.ok(overlay.country_rules.DE.providers.some(p=>p.name==='Tipico'&&p.domains.includes('tipico.de')));
assert.ok(overlay.country_rules.DE.providers.every(p=>p.domains.length&&p.license_holder&&p.license_scope==='online_sports_betting'&&p.bonus_status==='UNGEPRUEFT'));
assert.deepEqual(overlay.country_rules.CH.providers.map(p=>p.name), ['Swisslos Sporttip','Loterie Romande · Jouez Sport']);
assert.equal(overlay.country_rules.BR.status, 'excluded');
assert.deepEqual(overlay.country_rules.BR.providers, []);
assert.equal(overlay.country_rules.AT.status, 'regional');
assert.equal(Object.keys(overlay.country_rules.AT.regions).length,9);
assert.ok(Object.values(overlay.country_rules.AT.regions).every(r=>r.status!=='verified'&&r.providers.length===0));

const deepMerge = (target, source) => {
 for (const [k,v] of Object.entries(source)) {
   if (Array.isArray(v)) target[k]=v.slice();
   else if (v && typeof v==='object') {
     if (!target[k] || typeof target[k]!=='object' || Array.isArray(target[k])) target[k]={};
     deepMerge(target[k],v);
   } else target[k]=v;
 }
 return target;
};
for(const file of manifest.files) deepMerge(base,json('assets/'+file));
assert.equal(base.country_rules.DE.providers.length,31, 'final merged DE rule');
assert.equal(base.country_rules.CH.providers.length,2, 'final merged CH rule');
assert.equal(base.country_rules.BR.status,'excluded','final merged Brazil rule');
assert.equal(base.country_rules.AT.regions['AT-9'].status,'pending_filter');
assert.equal(base.country_rules.AT.regions['AT-1'].providers.length,0);

const regional = read('assets/regional-restrictions.js');
assert.match(regional,/return code === "BR";/);
assert.doesNotMatch(regional,/return brazilBettingBlockActive && code === "BR";/);
const legacy=read('anbieter-auswahl/index.html');
assert.match(legacy,/<meta http-equiv="refresh" content="0;url=\.\.\/anbieter\/"/);
assert.match(legacy,/location\.replace\("\.\.\/anbieter\/"\)/);
const selector=read('anbieter/index.html');
assert.match(selector,/function ruleIsFresh/);
assert.match(selector,/Bonusbedingungen: ungeprüft/);
assert.match(selector,/Amtlich registrierte Domain/);
const premium=read('premium-upgrade/index.html');
const guard=read('assets/premium-provider-details.js');
assert.match(premium,/premium-provider-details\.js\?v=20261021-1/);
assert.match(premium,/BetInsightPremiumEligibility\?\.isValid/);
assert.match(premium,/PREMIUM_CHECKOUT_URL='https:\/\/hook\.eu1\.make\.com\/oj6bq9eh2cprdkszwlbegh62nszod6v6'/);
assert.match(premium,/select\.providerType/);
assert.match(guard,/isFreshAllowedRule/);
assert.match(guard,/return type === "WHITELISTED" && approved\.includes\(value\)/);
assert.doesNotMatch(guard,/subtree:\s*true/);

for (const path of ['assets/regional-restrictions.js','assets/premium-provider-details.js']) {
 new vm.Script(read(path),{filename:path});
}
for(const path of ['anbieter/index.html','anbieter-auswahl/index.html','premium-upgrade/index.html']) {
 const html=read(path);let scripts=0;
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if (/\bsrc\s*=/.test(m[1]) || !m[2].trim())continue;
   new vm.Script(m[2],{filename:path+':inline-script-'+(++scripts)});
 }
 assert.ok(scripts>0,path+' must have inline JS');
}
console.log('PASS BetInsight whitelist regression: 93 merge files; DE 31; CH 2; AT 9 restricted; BR denied; legacy redirect; Premium script guards; all inline scripts parse.');
