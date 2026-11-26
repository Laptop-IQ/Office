// services/keyCustomerService.js
// Business logic for key customers. The Mongoose model is INJECTED, so this file
// has no DB / framework import and can be unit-tested with a fake model.
// Every query is scoped to `user` — one user can never touch another user's data.
import { notFound } from "../utils/httpError.js";

export const createKeyCustomerService = ({ Customer }) => ({
  // Mark / unmark many customers at once. Returns how many belonged to this user.
  async setKey(userId, ids, isKey) {
    const result = await Customer.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { isKey } },
    );
    return { matched: result.matchedCount ?? result.n ?? 0 };
  },

  // How often a KEY customer should be visited. Only works for the user's own key customers.
  async setVisitDays(userId, customerId, days) {
    const doc = await Customer.findOneAndUpdate(
      { _id: customerId, user: userId, isKey: true },
      { $set: { keyVisitDays: days } },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) throw notFound("Key customer not found.");
    return { _id: String(doc._id), isKey: !!doc.isKey, keyVisitDays: doc.keyVisitDays };
  },
});
