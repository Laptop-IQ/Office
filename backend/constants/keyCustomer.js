// constants/keyCustomer.js
// Single source of truth for the "Key Customer" feature (model, validators, service).
export const KEY_CUSTOMER = Object.freeze({
  DEFAULT_VISIT_DAYS: 14, // visit a key customer at least every N days
  MIN_VISIT_DAYS: 1,
  MAX_VISIT_DAYS: 365,
  MAX_BATCH: 1000, // customers (un)marked in one request
});
