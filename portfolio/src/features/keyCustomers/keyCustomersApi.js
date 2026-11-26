// features/keyCustomers/keyCustomersApi.js
// The only place that knows the key-customer endpoints. No React here.
import { apiFetch } from "../dsr/shared/http";
import { KEY_API } from "./constants";

// Mark / unmark many customers at once.  PUT /api/dsr/key-customers
export const setKeyFlag = (ids, isKey) =>
  apiFetch(KEY_API.base, { method: "PUT", body: JSON.stringify({ ids, isKey }) });

// How often a key customer should be visited.  PATCH /api/dsr/key-customers/:id
export const setVisitDays = (id, keyVisitDays) =>
  apiFetch(`${KEY_API.base}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ keyVisitDays }),
  });
