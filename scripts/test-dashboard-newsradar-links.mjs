import fs from "node:fs";import assert from "node:assert/strict";import vm from "node:vm";
for(const path of ["index.html","meldungen/index.html"]){
  const html=fs.readFileSync(path,"utf8");
  assert.match(html,/new URL\(String\(post\.external_url\|\|""\)\)/.test(html)?/dashboardOfficialTileHtml/ : /new URL\(String\(p\.external_url\|\|""\)\)/,path+" link selection");
  assert.match(html,/articleUrl\.protocol==="https:"/,'https-only '+path);
  assert.ok(html.includes('betinsight.club')&&html.includes('www.betinsight.club'),'domain allowlist '+path);
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(x=>!x[1].includes('src=')&&!x[1].includes('application/ld+json'));
  for(const s of scripts) new vm.Script(s[2],{filename:path});
}
console.log('PASS: Official dashboard and news archive open published BetInsight article URLs; embedded scripts parse.');
