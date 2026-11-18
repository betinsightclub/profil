import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {inspectMemberImage} from './image-upload-guard.mjs';
const samples={
 'image/png':'iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGPUit/CQApgIkn1qIYRpAEA8xIBVYydosoAAAAASUVORK5CYII=',
 'image/jpeg':'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAMABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDmKKKK+tPCP//Z',
 'image/webp':'UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoQAAwAAUAmJaACdLoB+AADsAD+8Gyv/0JPwSfgk/dP/+LORiOy8AAA'
};
test('actual generated 16 x 12 images accept only their own MIME and reject truncation or appended content',()=>{
 for(const [mime,b64] of Object.entries(samples)){
  const b=Buffer.from(b64,'base64');
  assert.deepEqual(inspectMemberImage(b,mime),{width:16,height:12,mime});
  for(const other of Object.keys(samples).filter(m=>m!==mime))assert.equal(inspectMemberImage(b,other),null);
  assert.equal(inspectMemberImage(b.subarray(0,b.length-1),mime),null);
  assert.equal(inspectMemberImage(Buffer.concat([b,Buffer.from('trailing data')]),mime),null);
 }
});
test('JSON, HTML, SVG, disguised files, invalid RIFF and oversized dimensions are rejected',()=>{
 for(const s of ['{"action":"not an image"}','<html><script>example</script></html>','<svg xmlns="http://www.w3.org/2000/svg"></svg>','RIFFxxxxWAVEabcdefghijk']){
  for(const mime of Object.keys(samples))assert.equal(inspectMemberImage(Buffer.from(s),mime),null);
 }
 assert.equal(inspectMemberImage(Buffer.from(samples['image/png'],'base64'),'application/json'),null);
 const png=Buffer.from(samples['image/png'],'base64');png.writeUInt32BE(65000,16);
 assert.equal(inspectMemberImage(png,'image/png'),null);
});
test('all inline scripts compile and every actual image picker has the allowlist',()=>{
 for(const path of ['stadionwelt/index.html','trainer/index.html']){
  const html=fs.readFileSync(path,'utf8');
  for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
   if(/type=["'](?:application\/ld\+json|application\/json|module)["']/.test(m[0].split('>')[0]))continue;
   new vm.Script(m[1],{filename:path+'#'+i});
  }
  const pickers=[...html.matchAll(/<input\b[^>]*type=['"]file['"][^>]*>/g)];
  assert.ok(pickers.length>=3,path);
  for(const p of pickers){assert.match(p[0],/accept=['"]\.jpg,\.jpeg,\.png,\.webp,image\/jpeg,image\/png,image\/webp['"]/);}
 }
 const s=fs.readFileSync('stadionwelt/index.html','utf8'),p=fs.readFileSync('trainer/index.html','utf8');
 assert.equal((s.match(/validStadiumPhoto\(/g)||[]).length,4);
 assert.equal((p.match(/allowedMemberPhoto\(/g)||[]).length,4);
 assert.ok(p.includes('Profil- und Hintergrundbilder: nur JPG'));
});


test('signed upload URL allows only the exact storage route on the API origin',()=>{
 const html=fs.readFileSync('trainer/index.html','utf8');
 const line=html.match(/if\(target\.origin!==new URL\(COMMUNITY_API\)\.origin\|\|\s*([^\n]+)\)\s*\n\s*throw new Error\("Ungültiges Upload-Ziel\."\);/);
 assert.ok(line,'URL guard exists');
 const check=new vm.Script('(target,COMMUNITY_API,URL)=>!(target.origin!==new URL(COMMUNITY_API).origin||'+line[1]+')').runInNewContext();
 const base='https://example.test';
 for(const bucket of ['community-media','community-media-pending'])assert.equal(check(new URL(base+'/storage/v1/object/upload/sign/'+bucket+'/owner/post/test.jpg'),base,URL),true);
 for(const bad of ['https://elsewhere.test/storage/v1/object/upload/sign/community-media-pending/a','https://example.test/foo/storage/v1/object/upload/sign/community-media/a','https://example.test/storage/v1/object/upload/sign/community-media-other/a'])assert.equal(check(new URL(bad),base,URL),false);
});


function postScanWaitHarness(responses){
 const html=fs.readFileSync('trainer/index.html','utf8');
 const source=html.match(/async function waitForPostImageScan\(payload\)\{[\s\S]*?\n      \}\n      async function uploadOriginalPostImage/)[0].replace(/\n      async function uploadOriginalPostImage$/,"");
 let calls=0,notices=0;
 const fn=new vm.Script(source+'\nwaitForPostImageScan').runInNewContext({
  communityCall:async(action,payload)=>{assert.equal(action,"finish_post_upload");assert.equal(payload.path,"owner/post/test.png");const next=responses[Math.min(calls++,responses.length-1)];if(next instanceof Error)throw next;return next},
  showToast:()=>{notices++},setTimeout:(resolve)=>resolve()
 });
 return {run:()=>fn({path:"owner/post/test.png"}),calls:()=>calls,notices:()=>notices};
}
test('existing immediate image response remains compatible',async()=>{
 const h=postScanWaitHarness([{ok:true,media:{id:"old"}}]);
 assert.equal((await h.run()).media.id,"old");assert.equal(h.calls(),1);assert.equal(h.notices(),0);
});
test('delayed image publication waits for successful scan',async()=>{
 const h=postScanWaitHarness([{ok:true,scan_pending:true},{ok:true,scan_pending:true},{ok:true,media:{id:"new"}}]);
 assert.equal((await h.run()).media.id,"new");assert.equal(h.calls(),3);assert.equal(h.notices(),1);
});
test('image scan rejection stops upload',async()=>{
 const h=postScanWaitHarness([{ok:true,scan_pending:true},new Error("IMAGE_SCAN_REJECTED")]);
 await assert.rejects(h.run(),/IMAGE_SCAN_REJECTED/);assert.equal(h.calls(),2);
});
test('pending scan times out without successful publication',async()=>{
 const h=postScanWaitHarness([{ok:true,scan_pending:true}]);
 await assert.rejects(h.run(),/nicht veröffentlicht/);assert.equal(h.calls(),51);
});

import './post-scan-gate.test.mjs';
