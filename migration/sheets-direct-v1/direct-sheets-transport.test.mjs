import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, webcrypto } from "node:crypto";
import {
  createDirectSheetsTransport,
  validateCellUpdates,
  KEY_RANGES,
  SPREADSHEET_ID,
} from "./direct-sheets-transport.mjs";

const allowedUpdate = [{
  updateCells: {
    start: { sheetId: 1403875477, rowIndex: 4, columnIndex: 13 },
    rows: [{ values: [{ userEnteredValue: { numberValue: 2.5 } }] }],
    fields: "userEnteredValue",
  },
}];

test("dry-run performs no network requests or writes", async () => {
  let calls = 0;
  const transport = createDirectSheetsTransport({
    fetcher: async () => { calls++; throw new Error("NETWORK_NOT_ALLOWED"); },
  });
  const read = await transport.readKeyRanges();
  const write = await transport.updateMirrorCells(allowedUpdate);
  assert.equal(calls, 0);
  assert.equal(read.dry_run, true);
  assert.equal(write.dry_run, true);
  assert.equal(write.validatedRequests, 1);
});

test("rejects unknown Sheet IDs, full-sheet operations and dangerous changes", () => {
  assert.throws(() => validateCellUpdates([{ updateCells: {
    ...allowedUpdate[0].updateCells,
    start: { sheetId: 999, rowIndex: 1, columnIndex: 0 },
  } }]), /SHEET_NOT_ALLOWLISTED/);
  assert.throws(() => validateCellUpdates([{ deleteDimension: {} }]), /ONLY_UPDATE_CELLS_ALLOWED/);
  assert.throws(() => validateCellUpdates([{ updateCells: {
    ...allowedUpdate[0].updateCells,
    fields: "*",
  } }]), /UNSAFE_FIELDS/);
  assert.throws(() => validateCellUpdates([]), /INVALID_BATCH_SIZE/);
});

test("live client uses service-account OAuth and exact spreadsheet, with token caching", async () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url: String(url), method: options.method, options });
    if (String(url).includes("/token")) {
      assert.match(options.body.toString(), /jwt-bearer/);
      return { ok: true, json: async () => ({ access_token: "test-token-not-real-and-long", expires_in: 3600 }) };
    }
    assert.match(options.headers.Authorization, /^Bearer test-token/);
    assert.ok(String(url).includes(SPREADSHEET_ID));
    return { ok: true, json: async () => ({ ok: true, totalUpdatedCells: 1 }) };
  };
  const transport = createDirectSheetsTransport({
    mode: "live",
    credentials: {
      type: "service_account",
      client_email: "test-service-account@example.test",
      token_uri: "https://oauth2.googleapis.com/token",
      private_key: keys.privateKey,
    },
    fetcher: fakeFetch,
    cryptoApi: webcrypto,
    clock: () => 1793700000000,
  });
  await transport.readKeyRanges();
  await transport.updateMirrorCells(allowedUpdate);
  assert.equal(calls.length, 3, "one token, one read, one write");
  assert.equal(calls[0].url, "https://oauth2.googleapis.com/token");
  const readUrl = new URL(calls[1].url);
  assert.deepEqual(readUrl.searchParams.getAll("ranges"), KEY_RANGES);
  const postBody = JSON.parse(calls[2].options.body);
  assert.equal(postBody.requests[0].updateCells.start.sheetId, 1403875477);
});

test("fail closed when no Google service account has been configured", async () => {
  const transport = createDirectSheetsTransport({ mode: "live", fetcher: async () => { throw new Error("UNEXPECTED_NETWORK"); } });
  await assert.rejects(transport.readKeyRanges(), /SERVICE_ACCOUNT_REQUIRED/);
  await assert.rejects(transport.updateMirrorCells(allowedUpdate), /SERVICE_ACCOUNT_REQUIRED/);
});
