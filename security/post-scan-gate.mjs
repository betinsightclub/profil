// Content-bound approval check. No credentials, network or user data.
export function postScanDecision(job, expected, nowMs=Date.now()){
 if(!job || job.kind!=="post" || job.owner_ref!==expected.owner_ref || job.club_id!==expected.club_id || job.storage_path!==expected.storage_path || job.sha256!==expected.sha256 || job.mime_type!==expected.mime_type || job.expected_bytes!==expected.expected_bytes || job.width!==expected.width || job.height!==expected.height)return "mismatch";
 if(job.status==="queued"||job.status==="leased")return "pending";
 if(job.status==="rejected"||job.status==="failed")return "rejected";
 if(job.status!=="clean")return "mismatch";
 const r=job.result;
 if(!r||r.sha256!==expected.sha256||r.bytes!==expected.expected_bytes||r.mime!==expected.mime_type||r.width!==expected.width||r.height!==expected.height||r.clamav!=="clean"||!Number.isSafeInteger(r.database_version)||r.database_version<28187)return "mismatch";
 const t=Date.parse(job.finished_at??"");
 if(!Number.isFinite(t)||t>nowMs+60000||nowMs-t>30*60000)return "expired";
 return "clean";
}

const TABLE="member_image_post_scan_jobs";
// No mutable approval or overwrite. Unique path serializes duplicate finalize requests.
export async function ensurePostScan(admin, expected, nowMs=Date.now()){
 const read=()=>admin.from(TABLE).select("*").eq("storage_path",expected.storage_path).maybeSingle();
 let existing=await read();
 if(existing.error)throw new Error("SCAN_QUEUE_READ_FAILED");
 if(!existing.data){
   const inserted=await admin.from(TABLE).upsert(expected,{onConflict:"storage_path",ignoreDuplicates:true});
   if(inserted.error)throw new Error("SCAN_QUEUE_WRITE_FAILED");
   existing=await read();
   if(existing.error||!existing.data)throw new Error("SCAN_QUEUE_READ_FAILED");
 }
 return postScanDecision(existing.data,expected,nowMs);
}
