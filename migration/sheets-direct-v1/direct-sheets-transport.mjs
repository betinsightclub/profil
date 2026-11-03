/**
 * BetInsight Tippfreischaltung – direkter Google-Sheets-Transport (STAGING).
 *
 * NO production integration. Defaults to dry-run; no Google API call is made
 * unless mode === "live" and credentials are explicitly provided.
 * Never store a service-account private key in GitHub. Supply the JSON via
 * the private Supabase secret BETINSIGHT_GOOGLE_SERVICE_ACCOUNT_JSON.
 *
 * Deliberately limited to the ten key ranges and nine writable tables used
 * by mirrorUnlockToSheets in betinsight-tips-api v15.
 */
export const SPREADSHEET_ID = "1qpQDGtE1bl2bw10S2rOd4tQ72RqBOL8q4P6V34Jmsxs";
export const KEY_RANGES = Object.freeze([
  "USER!G2:G",
  "TIPPS!A2:A",
  "FREISCHALTUNG!Q2:Q",
  "UNIT_KAEUFE!B2:B",
  "BO_ADMIN_EINNAHMEN!B2:B",
  "REF_BEWEGUNGEN!T2:T",
  "BO_TIPP_NUTZUNGEN!A2:A",
  "BO_TIPP_NUTZUNGEN!BU2:BU",
  "BO_ADMIN_VERGUETUNGS_LEDGER!A2:A",
  "UNIT_TRANSACTIONS!A2:A",
]);
export const WRITABLE_SHEET_IDS = Object.freeze([
  1403875477, // USER
  400122272,  // TIPPS
  1267394076, // FREISCHALTUNG
  424198885,  // UNIT_KAEUFE
  2101000008, // BO_ADMIN_EINNAHMEN
  351851327,  // REF_BEWEGUNGEN
  2101000030, // BO_TIPP_NUTZUNGEN
  2101000012, // BO_ADMIN_VERGUETUNGS_LEDGER
  229094077,  // UNIT_TRANSACTIONS
]);

const ALLOWED = new Set(WRITABLE_SHEET_IDS);
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_URL = "https://sheets.googleapis.com/v4/spreadsheets/";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8(input) {
  return new TextEncoder().encode(input);
}

function pemBytes(pem) {
  ensure(typeof pem === "string" && pem.includes("BEGIN PRIVATE KEY"), "SERVICE_ACCOUNT_PRIVATE_KEY_MISSING");
  const compact = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const raw = atob(compact);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

/** Strict validation: only cell changes on documented legacy mirror tabs. */
export function validateCellUpdates(requests) {
  ensure(Array.isArray(requests) && requests.length > 0 && requests.length <= 400, "INVALID_BATCH_SIZE");
  for (const item of requests) {
    ensure(item && Object.keys(item).length === 1 && item.updateCells, "ONLY_UPDATE_CELLS_ALLOWED");
    const u = item.updateCells;
    ensure(u.fields === "userEnteredValue", "UNSAFE_FIELDS");
    ensure(u.start && Number.isSafeInteger(u.start.rowIndex) && u.start.rowIndex >= 1, "INVALID_ROW");
    ensure(Number.isSafeInteger(u.start.columnIndex) && u.start.columnIndex >= 0 && u.start.columnIndex < 120, "INVALID_COLUMN");
    ensure(ALLOWED.has(u.start.sheetId), "SHEET_NOT_ALLOWLISTED");
    ensure(Array.isArray(u.rows) && u.rows.length > 0 && u.rows.length <= 200, "INVALID_ROW_COUNT");
    for (const row of u.rows) {
      ensure(Array.isArray(row?.values) && row.values.length <= 120, "INVALID_CELL_COUNT");
      for (const cell of row.values) {
        ensure(cell && typeof cell === "object" && Object.keys(cell).every(k => k === "userEnteredValue"), "INVALID_CELL");
        if (cell.userEnteredValue) {
          ensure(Object.keys(cell.userEnteredValue).every(k => ["numberValue", "stringValue", "boolValue"].includes(k)), "UNSAFE_CELL_VALUE");
        }
      }
    }
  }
  return requests.length;
}

/**
 * Uses Google OAuth service-account credentials; does not depend on Make.
 * mode "dry-run" never calls fetch and does not require credentials.
 * mode "live" is NOT activated in production by this staging file.
 */
export function createDirectSheetsTransport({
  mode = "dry-run",
  credentials = null,
  fetcher = fetch,
  clock = () => Date.now(),
  cryptoApi = crypto,
} = {}) {
  ensure(mode === "dry-run" || mode === "live", "INVALID_MODE");
  let tokenCache = null;

  async function accessToken() {
    ensure(mode === "live", "DRY_RUN");
    ensure(credentials?.type === "service_account", "SERVICE_ACCOUNT_REQUIRED");
    ensure(typeof credentials.client_email === "string" && credentials.client_email.includes("@"), "CLIENT_EMAIL_REQUIRED");
    ensure(typeof credentials.token_uri === "string" && credentials.token_uri === GOOGLE_TOKEN_URL, "UNTRUSTED_TOKEN_URI");
    if (tokenCache && tokenCache.expiresAt > clock() + 120000) return tokenCache.token;

    const now = Math.floor(clock() / 1000);
    const header = b64url(utf8(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const claims = b64url(utf8(JSON.stringify({
      iss: credentials.client_email,
      scope: SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3500,
    })));
    const message = header + "." + claims;
    const key = await cryptoApi.subtle.importKey("pkcs8", pemBytes(credentials.private_key), {
      name: "RSASSA-PKCS1-v1_5", hash: "SHA-256",
    }, false, ["sign"]);
    const signature = await cryptoApi.subtle.sign("RSASSA-PKCS1-v1_5", key, utf8(message));
    const jwt = message + "." + b64url(new Uint8Array(signature));
    const res = await fetcher(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    ensure(res.ok, "GOOGLE_OAUTH_FAILED_" + res.status);
    const payload = await res.json();
    ensure(typeof payload.access_token === "string" && payload.access_token.length > 20, "GOOGLE_OAUTH_EMPTY");
    tokenCache = {
      token: payload.access_token,
      expiresAt: clock() + Math.min(Number(payload.expires_in || 3500), 3500) * 1000,
    };
    return tokenCache.token;
  }

  async function request(url, method, body) {
    if (mode !== "live") return { ok: true, dry_run: true, method, planned_only: true };
    const token = await accessToken();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetcher(url, {
        method,
        headers: {
          Authorization: "Bearer " + token,
          ...(body !== null ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== null ? { body: JSON.stringify(body) } : {}),
        signal: ctrl.signal,
      });
      ensure(res.ok, "GOOGLE_SHEETS_REQUEST_FAILED_" + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({
    async readKeyRanges() {
      const params = new URLSearchParams({
        majorDimension: "ROWS",
        valueRenderOption: "UNFORMATTED_VALUE",
      });
      for (const range of KEY_RANGES) params.append("ranges", range);
      return await request(GOOGLE_API_URL + SPREADSHEET_ID + "/values:batchGet?" + params, "GET", null);
    },
    async updateMirrorCells(requests) {
      const count = validateCellUpdates(requests);
      const result = await request(GOOGLE_API_URL + SPREADSHEET_ID + ":batchUpdate", "POST", {
        requests,
        includeSpreadsheetInResponse: false,
      });
      return { ...result, validatedRequests: count };
    },
  });
}
