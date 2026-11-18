import test from 'node:test';
import assert from 'node:assert/strict';
import {postScanDecision} from './post-scan-gate.mjs';
const now=Date.parse('2026-11-18T22:00:00Z');
const expected={kind:'post',owner_ref:'BI123',club_id:'club',storage_path:'BI123/post/a.png',sha256:'a'.repeat(64),mime_type:'image/png',expected_bytes:140,width:64,height:48};
const clean={...expected,status:'clean',finished_at:new Date(now).toISOString(),result:{sha256:expected.sha256,bytes:140,mime:'image/png',width:64,height:48,clamav:'clean',database_version:28187}};
test('only exact clean result is accepted',()=>assert.equal(postScanDecision(clean,expected,now),'clean'));
test('queued and leased not published',()=>{for(const status of ['queued','leased'])assert.equal(postScanDecision({...clean,status},expected,now),'pending')});
test('rejected and failed not published',()=>{for(const status of ['rejected','failed'])assert.equal(postScanDecision({...clean,status},expected,now),'rejected')});
test('wrong owner, club, path, bytes, hash, format, dimensions and kind fail closed',()=>{for(const key of Object.keys(expected))assert.equal(postScanDecision({...clean,[key]:'changed'},expected,now),'mismatch',key)});
test('wrong result fields fail closed',()=>{for(const key of Object.keys(clean.result))assert.equal(postScanDecision({...clean,result:{...clean.result,[key]:'bad'}},expected,now),'mismatch',key)});
test('expired or missing approvals fail closed',()=>{assert.equal(postScanDecision(clean,expected,now+31*60000),'expired');assert.equal(postScanDecision(null,expected,now),'mismatch')});

import {ensurePostScan} from './post-scan-gate.mjs';
function dbMock(initial){
 let row=initial,insertions=0;
 const db={from(table){
  assert.equal(table,'member_image_post_scan_jobs');
  return {select(){return {eq(key,value){assert.equal(key,'storage_path');assert.equal(value,expected.storage_path);return {maybeSingle:async()=>({data:row,error:null})}}}},upsert:async(v,opts)=>{assert.equal(opts.ignoreDuplicates,true);assert.equal(opts.onConflict,'storage_path');insertions++;if(!row)row={...v,status:'queued'};return {error:null}}};
 }};
 return {db,insertions:()=>insertions};
}
test('missing approval queues exactly once and stays pending',async()=>{
 const m=dbMock(null);
 assert.equal(await ensurePostScan(m.db,expected,now),'pending');
 assert.equal(await ensurePostScan(m.db,expected,now),'pending');
 assert.equal(m.insertions(),1);
});
test('changed hash cannot replace previously clean approval',async()=>{
 const m=dbMock(clean);
 assert.equal(await ensurePostScan(m.db,{...expected,sha256:'b'.repeat(64)},now),'mismatch');
 assert.equal(m.insertions(),0);
});
test('queue read errors stop publication',async()=>{
 const db={from(){return {select(){return {eq(){return {maybeSingle:async()=>({error:new Error('offline')})}}}}}}};
 await assert.rejects(ensurePostScan(db,expected,now),/SCAN_QUEUE_READ_FAILED/);
});
