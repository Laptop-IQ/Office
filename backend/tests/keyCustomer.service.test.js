import { test } from "node:test";
import assert from "node:assert/strict";
import { createKeyCustomerService } from "../services/keyCustomerService.js";
import { HttpError } from "../utils/httpError.js";

// Fake in-memory "Customer" model implementing only what the service calls.
const makeFakeModel = (docs) => {
  const calls = [];
  const matches = (d, f) =>
    (!f._id || (f._id.$in ? f._id.$in.includes(d._id) : f._id === d._id)) &&
    (!f.user || d.user === f.user) &&
    (f.isKey === undefined || d.isKey === f.isKey);
  return {
    calls,
    async updateMany(filter, update) {
      calls.push(["updateMany", filter, update]);
      const hit = docs.filter((d) => matches(d, filter));
      hit.forEach((d) => Object.assign(d, update.$set));
      return { matchedCount: hit.length };
    },
    findOneAndUpdate(filter, update, opts) {
      calls.push(["findOneAndUpdate", filter, update, opts]);
      const d = docs.find((x) => matches(x, filter));
      if (d) Object.assign(d, update.$set);
      return { lean: async () => (d ? { ...d } : null) };
    },
  };
};

const seed = () => [
  { _id: "c1", user: "u1", isKey: false, keyVisitDays: 14 },
  { _id: "c2", user: "u1", isKey: true, keyVisitDays: 14 },
  { _id: "c3", user: "u2", isKey: false, keyVisitDays: 14 }, // another user's customer
];

test("setKey marks only the caller's customers (user isolation)", async () => {
  const docs = seed();
  const svc = createKeyCustomerService({ Customer: makeFakeModel(docs) });
  const out = await svc.setKey("u1", ["c1", "c3"], true);
  assert.equal(out.matched, 1); // c3 belongs to u2 → untouched
  assert.equal(docs.find((d) => d._id === "c1").isKey, true);
  assert.equal(docs.find((d) => d._id === "c3").isKey, false);
});

test("setKey query is always scoped by user", async () => {
  const model = makeFakeModel(seed());
  await createKeyCustomerService({ Customer: model }).setKey("u1", ["c1"], false);
  const [, filter, update] = model.calls[0];
  assert.equal(filter.user, "u1");
  assert.deepEqual(update, { $set: { isKey: false } });
});

test("setVisitDays updates an own KEY customer and returns a small DTO", async () => {
  const docs = seed();
  const model = makeFakeModel(docs);
  const out = await createKeyCustomerService({ Customer: model }).setVisitDays("u1", "c2", 7);
  assert.deepEqual(out, { _id: "c2", isKey: true, keyVisitDays: 7 });
  const [, filter, , opts] = model.calls[0];
  assert.deepEqual(filter, { _id: "c2", user: "u1", isKey: true });
  assert.equal(opts.runValidators, true);
});

test("setVisitDays → 404 for non-key customer, other user's customer, or unknown id", async () => {
  const svc = createKeyCustomerService({ Customer: makeFakeModel(seed()) });
  for (const [user, id] of [["u1", "c1"], ["u1", "c3"], ["u2", "c2"], ["u1", "zzz"]]) {
    await assert.rejects(
      () => svc.setVisitDays(user, id, 7),
      (e) => e instanceof HttpError && e.status === 404,
    );
  }
});
