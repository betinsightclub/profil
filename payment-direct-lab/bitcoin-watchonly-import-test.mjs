import assert from "node:assert/strict";
import {HDKey} from "@scure/bip32";
import {prepareBitcoinReceivePool as prepare} from "./bitcoin-watchonly-import.mjs";
// Published PUBLIC BIP84 test vector: https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
// Never use these addresses for payment, they are publicly known test fixtures.
const extendedPublicKey="zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs";
const addr0="bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu",addr1="bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g";
const base={extendedPublicKey,accountPath:"m/84'/0'/0'",anchor:{index:0,address:addr0},start:0,count:2};
let pass=0;
const verify=(input,code)=>{assert.equal(prepare(input).code,code);pass++};
const p=prepare(base);assert.equal(p.ok,true,JSON.stringify(p));assert.deepEqual(p.entries.map(x=>x.address),[addr0,addr1]);assert.equal(p.authorizesAllocation,false);assert.ok(p.entries.every(x=>/^0014[0-9a-f]{40}$/.test(x.scriptPubKey)));pass++;
const key=HDKey.fromExtendedKey(extendedPublicKey,{public:0x04b24746,private:0x04b2430c});
const xpub=new HDKey({depth:key.depth,index:key.index,parentFingerprint:key.parentFingerprint,chainCode:key.chainCode,publicKey:key.publicKey}).publicExtendedKey;
assert.deepEqual(prepare({...base,extendedPublicKey:xpub}).entries,p.entries);pass++;
verify({...base,extendedPublicKey:"xprv"+extendedPublicKey.slice(4)},"PUBLIC_ACCOUNT_KEY_REQUIRED");
verify({...base,extendedPublicKey:"vpub"+extendedPublicKey.slice(4)},"PUBLIC_ACCOUNT_KEY_REQUIRED");
verify({...base,accountPath:"m/44'/0'/0'"},"BIP84_MAINNET_PATH_REQUIRED");
verify({...base,accountPath:"m/84'/0'/1'"},"ACCOUNT_KEY_MISMATCH");
verify({...base,anchor:{index:0,address:addr1}},"DEVICE_ADDRESS_MISMATCH");
verify({...base,count:21},"BOUNDED_RANGE_REQUIRED");
verify({...base,start:0x80000000-1,count:2},"BOUNDED_RANGE_REQUIRED");
verify({...base,anchor:null},"DEVICE_CONFIRMED_ADDRESS_REQUIRED");
verify({...base,privateKey:"fixture"},"INVALID_SCHEMA");
verify({...base,extendedPublicKey:extendedPublicKey.slice(0,-1)+"t"},"INVALID_PUBLIC_KEY_OR_DERIVATION");
console.log("BITCOIN WATCH-ONLY "+pass+"/12 passed; published public fixtures only. No funds, no allocation.");
