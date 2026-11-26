import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseKeyToggle,
  parseVisitDays,
  parseCustomerId,
  isObjectId,
} from "../validators/keyCustomerValidators.js";
import { HttpError } from "../utils/httpError.js";
import { KEY_CUSTOMER } from "../constants/keyCustomer.js";

const ID_A = "64b7f0c2a1b2c3d4e5f60718";
const ID_B = "64b7f0c2a1b2c3d4e5f60719";
const throws400 = (fn, re) =>
  assert.throws(fn, (e) => e instanceof HttpError && e.status === 400 && (!re || re.test(e.message)));

test("isObjectId accepts 24-hex only", () => {
  assert.equal(isObjectId(ID_A), true);
  assert.equal(isObjectId("123"), false);
  assert.equal(isObjectId({ $ne: "" }), false); // NoSQL-operator object is rejected
  assert.equal(isObjectId(undefined), false);
});

test("parseKeyToggle: de-duplicates ids and coerces booleans", () => {
  assert.deepEqual(parseKeyToggle({ ids: [ID_A, ID_A, ID_B], isKey: true }), { ids: [ID_A, ID_B], isKey: true });
  assert.equal(parseKeyToggle({ ids: [ID_A], isKey: "false" }).isKey, false);
});

test("parseKeyToggle: rejects bad input", () => {
  throws400(() => parseKeyToggle(undefined), /at least one/i);
  throws400(() => parseKeyToggle({ ids: [], isKey: true }), /at least one/i);
  throws400(() => parseKeyToggle({ ids: "x", isKey: true }));
  throws400(() => parseKeyToggle({ ids: ["nope"], isKey: true }), /invalid customer id/i);
  throws400(() => parseKeyToggle({ ids: [ID_A] }), /isKey/);
  throws400(() => parseKeyToggle({ ids: [ID_A], isKey: "yes" }), /isKey/);
});

test("parseKeyToggle: enforces batch limit", () => {
  const many = Array.from({ length: KEY_CUSTOMER.MAX_BATCH + 1 }, (_, i) => i.toString(16).padStart(24, "0"));
  throws400(() => parseKeyToggle({ ids: many, isKey: true }), /too many/i);
  const ok = many.slice(0, KEY_CUSTOMER.MAX_BATCH);
  assert.equal(parseKeyToggle({ ids: ok, isKey: true }).ids.length, KEY_CUSTOMER.MAX_BATCH);
});

test("parseVisitDays: integers in range only", () => {
  assert.equal(parseVisitDays({ keyVisitDays: 7 }), 7);
  assert.equal(parseVisitDays({ keyVisitDays: "30" }), 30);
  assert.equal(parseVisitDays({ keyVisitDays: KEY_CUSTOMER.MIN_VISIT_DAYS }), 1);
  assert.equal(parseVisitDays({ keyVisitDays: KEY_CUSTOMER.MAX_VISIT_DAYS }), 365);
  [0, -3, 366, 7.5, "abc", "", null, undefined, NaN, {}, [7]].forEach((bad) =>
    throws400(() => parseVisitDays({ keyVisitDays: bad }), /whole number between 1 and 365/),
  );
  throws400(() => parseVisitDays(undefined));
});

test("parseCustomerId", () => {
  assert.equal(parseCustomerId(ID_A), ID_A);
  throws400(() => parseCustomerId("1"), /invalid customer id/i);
});
