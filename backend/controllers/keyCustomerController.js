// controllers/keyCustomerController.js — HTTP only: parse → service → respond.
import Customer from "../models/Customer.js";
import { createKeyCustomerService } from "../services/keyCustomerService.js";
import {
  parseKeyToggle,
  parseVisitDays,
  parseCustomerId,
} from "../validators/keyCustomerValidators.js";
import { route } from "../utils/httpError.js";

const service = createKeyCustomerService({ Customer });

// PUT /api/dsr/key-customers   body: { ids: [...], isKey: true|false }
export const setKeyCustomers = route(async (req, res) => {
  const { ids, isKey } = parseKeyToggle(req.body);
  const { matched } = await service.setKey(req.user.id, ids, isKey);
  res.status(200).json({ success: true, matched });
});

// PATCH /api/dsr/key-customers/:id   body: { keyVisitDays: 7 }
export const setVisitFrequency = route(async (req, res) => {
  const id = parseCustomerId(req.params.id);
  const days = parseVisitDays(req.body);
  const data = await service.setVisitDays(req.user.id, id, days);
  res.status(200).json({ success: true, data });
});
