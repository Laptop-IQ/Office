// Controller wiring: validator → service → real Mongoose model (methods stubbed, no DB needed).
import { test } from "node:test";
import assert from "node:assert/strict";
import Customer from "../models/Customer.js";
import { setKeyCustomers, setVisitFrequency } from "../controllers/keyCustomerController.js";

const mkRes = () => { const r = { code: 200, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
const ID = "64b7f0c2a1b2c3d4e5f60718";
const req = (over) => ({ user: { id: "u1" }, method: "PUT", originalUrl: "/x", body: {}, params: {}, ...over });

test("PUT bulk: 400 JSON on bad body (no DB touched)", async () => {
  Customer.updateMany = () => { throw new Error("must not be called"); };
  const res = mkRes();
  await setKeyCustomers(req({ body: { ids: [], isKey: true } }), res);
  assert.equal(res.code, 400); assert.equal(res.body.success, false); assert.match(res.body.message, /at least one/i);
});

test("PUT bulk: success shape + scoped query", async () => {
  let seen;
  Customer.updateMany = async (f, u) => { seen = [f, u]; return { matchedCount: 2 }; };
  const res = mkRes();
  await setKeyCustomers(req({ body: { ids: [ID, ID], isKey: true } }), res);
  assert.deepEqual(res.body, { success: true, matched: 2 });
  assert.equal(seen[0].user, "u1"); assert.deepEqual(seen[0]._id.$in, [ID]);
});

test("PATCH frequency: 400 invalid id / invalid days", async () => {
  Customer.findOneAndUpdate = () => { throw new Error("must not be called"); };
  let res = mkRes(); await setVisitFrequency(req({ params: { id: "bad" }, body: { keyVisitDays: 7 } }), res); assert.equal(res.code, 400);
  res = mkRes(); await setVisitFrequency(req({ params: { id: ID }, body: { keyVisitDays: 0 } }), res); assert.equal(res.code, 400);
});

test("PATCH frequency: 200 DTO, 404 when not a key customer, 500 on unexpected error", async () => {
  Customer.findOneAndUpdate = () => ({ lean: async () => ({ _id: ID, isKey: true, keyVisitDays: 7 }) });
  let res = mkRes(); await setVisitFrequency(req({ params: { id: ID }, body: { keyVisitDays: 7 } }), res);
  assert.equal(res.code, 200); assert.deepEqual(res.body, { success: true, data: { _id: ID, isKey: true, keyVisitDays: 7 } });
  Customer.findOneAndUpdate = () => ({ lean: async () => null });
  res = mkRes(); await setVisitFrequency(req({ params: { id: ID }, body: { keyVisitDays: 7 } }), res); assert.equal(res.code, 404);
  Customer.findOneAndUpdate = () => { throw new Error("db down"); };
  const log = console.error; console.error = () => {};
  res = mkRes(); await setVisitFrequency(req({ params: { id: ID }, body: { keyVisitDays: 7 } }), res); console.error = log;
  assert.equal(res.code, 500); assert.equal(res.body.message, "Server error");
});

test("toClient-shape: Customer schema exposes isKey + keyVisitDays defaults", () => {
  const d = new Customer({ user: "64b7f0c2a1b2c3d4e5f60718", name: "X", area: "A", distributor: "Supple" });
  assert.equal(d.isKey, false); assert.equal(d.keyVisitDays, 14);
  assert.equal(d.validateSync()?.errors?.keyVisitDays, undefined);
  d.keyVisitDays = 999; assert.ok(d.validateSync().errors.keyVisitDays);
});
