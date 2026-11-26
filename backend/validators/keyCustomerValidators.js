// validators/keyCustomerValidators.js
// Pure input validation (no DB, no Express) → easy to unit-test.
// Every function either returns clean values or throws HttpError(400).
import { KEY_CUSTOMER } from "../constants/keyCustomer.js";
import { badRequest } from "../utils/httpError.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;
export const isObjectId = (v) => typeof v === "string" && OBJECT_ID.test(v);

const toStrictBool = (v, field) => {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  throw badRequest(`"${field}" must be true or false.`);
};

// body: { ids: ["<customerId>", ...], isKey: true|false }
export const parseKeyToggle = (body) => {
  const { ids, isKey } = body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    throw badRequest("Select at least one customer.");
  }
  if (ids.length > KEY_CUSTOMER.MAX_BATCH) {
    throw badRequest(`Too many customers at once (max ${KEY_CUSTOMER.MAX_BATCH}).`);
  }
  const unique = [...new Set(ids.map(String))];
  if (!unique.every(isObjectId)) throw badRequest("Invalid customer id.");
  return { ids: unique, isKey: toStrictBool(isKey, "isKey") };
};

// body: { keyVisitDays: 14 }
export const parseVisitDays = (body) => {
  const raw = body?.keyVisitDays;
  const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  const { MIN_VISIT_DAYS: min, MAX_VISIT_DAYS: max } = KEY_CUSTOMER;
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`Visit frequency must be a whole number between ${min} and ${max} days.`);
  }
  return n;
};

export const parseCustomerId = (id) => {
  if (!isObjectId(id)) throw badRequest("Invalid customer id.");
  return id;
};
