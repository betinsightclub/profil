'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'tipps/index.html'),'utf8');
const begin=html.indexOf('function specialPreviewCard(){');
const end=html.indexOf('function drawNew(){',begin);
const special=html.slice(begin,end);
const langs=['de','en','es','fr','it','nl','pt','zh-tw'];
const privateHints=/FC Bayern|Borussia Dortmund|RB Leipzig|Bayer Leverkusen|Top[- ]?4|Bundesliga|Opta|Platz 1[–\-]4|Champions.League/i;

test('special pre-unlock rendering contains no paywalled selections',()=>{
  assert.ok(begin>0 && end>begin,'specialPreviewCard exists');
  assert.doesNotMatch(special,privateHints);
  assert.match(special,/details|geschützt|protected|specialConfidential/i);
  assert.match(special,/BI-SP-2627-['"]\+num/);
  assert.doesNotMatch(special,/BI-SP-2627-TOP4-/);
  assert.match(special,/unlockTip\(tip,button,feedback\)/);
});

test('all language files keep protected details hidden',()=>{
 for(const lang of langs){
   const langData=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/pages/tips',lang+'.json'),'utf8')).tipsCenter;
   for(const key of ['testingSub','specialTitle','specialIntro','specialBetMarket','specialCompensation','specialSource']){
      assert.ok(langData[key],lang+': '+key+' is present');
      assert.doesNotMatch(langData[key],privateHints,lang+': '+key+' leaks confidential prediction');
   }
 }
});

test('Spezial refund display is one sentence and contains no internal accounting explanations',()=>{
  assert.match(special,/Für jeden freigeschalteten Tipp aus dieser Kategorie, der als verloren gewertet wird, erhältst du die dafür bezahlte 1 Unit erstattet/);
  assert.doesNotMatch(special,/specialDisclaimer|specialDeadline|Gift-Unit|Geschenk-Unit|Provisionen|Wetteinsätze|Wettverluste/);
  for(const lang of langs){
    const strings=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/pages/tips',lang+'.json'),'utf8')).tipsCenter;
    assert.ok(strings.specialCompensation.includes('1 Unit'),lang+': refund quantity');
    assert.equal(strings.specialCompensation.match(/[.!?。]/g)?.length||0,1,lang+': exactly one sentence');
  }
});

test('Spezial tile shows standard non-secret sports and season metadata',()=>{
  for(const key of ['sport','betType','league','tipsterField','specialSeasonLabel','specialDeadlineLabel','specialSettlementLabel','oddsRange','market','fixture','selection']){
    assert.ok(special.includes('tr("'+key+'"'),key+': preview field is present');
  }
  for(const field of ['spiel','markt','tipp','quote','liga']){
    assert.doesNotMatch(special,new RegExp('tip\\\\.'+field+'\\\\b'),'secret tip field must never be used in pre-unlock tile');
  }
  assert.match(special,/shortDate\\(tip\\.spiel_datum\\)/);
  assert.match(special,/specialLockedValue/);
  assert.match(special,/specialOddsUnverified/);
  assert.doesNotMatch(special,/tr\\("kickoff"/,'season deadline must not be mislabelled as kickoff');
  for(const lang of langs){
    const strings=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/pages/tips',lang+'.json'),'utf8')).tipsCenter;
    for(const key of ['specialLockedValue','specialBetKind','specialTipster','specialSeasonLabel','specialDeadlineLabel','specialGermanTime','specialSettlementLabel','specialSettlementValue','specialOddsUnverified','specialDeadlineFallback']){
      assert.ok(strings[key],lang+': '+key+' available');
      assert.doesNotMatch(strings[key],privateHints,lang+': '+key+' remains non-secret');
    }
  }
});
