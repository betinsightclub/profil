// BetInsight Consensus: isolated read-only master feed / authenticated server ingestion
// Never publish tips or modify existing tip/provider tables.
const SURL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const SKEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ORIGINS = new Set(["https://app.betinsight.club", "https://betinsight.club", "https://www.betinsight.club"]);
const enc = new TextEncoder();

function reply(body: unknown, status = 200, origin = "") {
  const headers: Record<string,string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  };
  if (ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "content-type, x-bi-consensus-token";
  }
  return new Response(JSON.stringify(body), {status,headers});
}
async function rest(path: string, options: RequestInit = {}) {
  const headers = {
    "apikey": SKEY,
    "Authorization": "Bearer " + SKEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {})
  };
  const response = await fetch(SURL + "/rest/v1/" + path, {...options, headers, cache:"no-store"});
  if (!response.ok) throw new Error("DB_" + response.status);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function digest(s: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}
function equalDigest(a: string, b: string) {
  if(a.length !== 64 || b.length !== 64) return false;
  let v = 0; for(let i=0;i<64;i++) v |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return v === 0;
}
function validRow(r: any) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return false;
  const strings = ["match_id", "market", "outcome", "home", "away", "kickoff", "observed"];
  if (!strings.every(k => typeof r[k] === "string" && r[k].length > 0 && r[k].length <= 150)) return false;
  if (!(r.market === "1X2" ? ["1", "X", "2"].includes(r.outcome) :
        r.market === "OU25" ? ["O", "U"].includes(r.outcome) : false)) return false;
  if (!Number.isFinite(Date.parse(r.kickoff)) || !Number.isFinite(Date.parse(r.observed)) || Date.parse(r.observed) >= Date.parse(r.kickoff)) return false;
  if (typeof r.probability !== "number" || !Number.isFinite(r.probability) || r.probability < 75 || r.probability > 100) return false;
  if (typeof r.odds !== "number" || !Number.isFinite(r.odds) || r.odds < 1.35 || r.odds > 1000) return false;
  const bothNull = r.home_goals === null && r.away_goals === null;
  const bothInt = Number.isInteger(r.home_goals) && Number.isInteger(r.away_goals) &&
      r.home_goals >= 0 && r.away_goals >= 0 && r.home_goals < 100 && r.away_goals < 100;
  return bothNull || bothInt;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (req.method === "OPTIONS") {
    if (!ORIGINS.has(origin)) return reply({ok:false,error:"ORIGIN_NOT_ALLOWED"},403,origin);
    return reply({ok:true},200,origin);
  }
  if (req.method !== "POST") return reply({ok:false,error:"METHOD_NOT_ALLOWED"},405,origin);
  if (origin && !ORIGINS.has(origin)) return reply({ok:false,error:"ORIGIN_NOT_ALLOWED"},403,origin);
  if (!SURL || !SKEY) return reply({ok:false,error:"UNCONFIGURED"},503,origin);
  const action = new URL(req.url).searchParams.get("action");
  try {
    if (action === "ingest") {
      if(origin) return reply({ok:false,error:"ORIGIN_NOT_ALLOWED"},403,origin);
      const token = req.headers.get("x-bi-consensus-token") || "";
      if(token.length < 32 || token.length > 256) return reply({ok:false,error:"UNAUTHORIZED"},401);
      const config = await rest("betinsight_consensus_ingest_key_v1?scope=eq.production&select=token_sha256");
      const expected = String(config?.[0]?.token_sha256 || "").trim();
      if (!equalDigest(await digest(token), expected)) return reply({ok:false,error:"UNAUTHORIZED"},401);
      const raw = await req.text();
      if(raw.length > 230000) return reply({ok:false,error:"TOO_LARGE"},413);
      const data = JSON.parse(raw);
      if (data?.schema !== "betinsight-consensus-paper-v1" || data?.source !== "AI_APIS_PAPER" || !Array.isArray(data?.rows) || data.rows.length > 500 ||
          !Number.isFinite(Date.parse(data.generated_at)) || Date.parse(data.generated_at) > Date.now() + 300000 ||
          !data.rows.every(validRow)) return reply({ok:false,error:"INVALID_FEED"},422);
      const seen = new Set<string>();
      for(const r of data.rows) {
        const id = [r.match_id,r.market,r.outcome].join("|");
        if (seen.has(id)) return reply({ok:false,error:"DUPLICATES"},422);
        seen.add(id);
      }
      const item = {scope:"production", generated_at:data.generated_at, payload:{schema:data.schema, source:data.source, rows:data.rows}, synced_at:new Date().toISOString()};
      await rest("betinsight_consensus_feed_v1?on_conflict=scope", {method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(item)});
      return reply({ok:true,stored:data.rows.length});
    }
    if (action === "read") {
      if ((req.headers.get("content-length")||"").length > 8) return reply({ok:false,error:"INVALID_REQUEST"},413,origin);
      const data = await req.json();
      const hash = String(data?.session_hash || "").toLowerCase();
      if(!/^[0-9a-f]{64}$/.test(hash)) return reply({ok:false,error:"UNAUTHORIZED"},401,origin);
      const verified = await rest("rpc/betinsight_admin_session_check_v1",
        {method:"POST",body:JSON.stringify({p_session_hash:hash,p_require_master:true})});
      if (verified?.ok !== true || String(verified?.master) !== "JA") return reply({ok:false,error:"MASTER_REQUIRED"},403,origin);
      const records = await rest("betinsight_consensus_feed_v1?scope=eq.production&select=generated_at,synced_at,payload");
      const first = records?.[0];
      return reply({ok:true,generated_at:first?.generated_at || null,synced_at:first?.synced_at || null,
        source:first?.payload?.source || "AI_APIS_PAPER", rows:first?.payload?.rows || [],publication_enabled:false},200,origin);
    }
    return reply({ok:false,error:"UNKNOWN_ACTION"},404,origin);
  } catch (e) {
    console.error("Consensus bridge failure", String(e).replace(/(?:secret|token|key)=\S+/gi,"[masked]"));
    return reply({ok:false,error:"BRIDGE_FAILED"},500,origin);
  }
});