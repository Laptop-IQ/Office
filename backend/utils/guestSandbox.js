// utils/guestSandbox.js
// ─────────────────────────────────────────────────────────────────────────────
// Guest demo = a private sandbox per visitor.
//
//   "Continue as Guest"  → a temporary User (isGuest) is created and the demo
//                          template's data is COPIED to it (new _ids).
//   Guest edits anything → only the guest's own copy changes, so the app behaves
//                          exactly like a normal account while they use it.
//   Guest logs out       → the guest user and every document it owns are deleted.
//   Tab closed / expired → a sweeper deletes the sandbox after GUEST_TTL_MINUTES.
//
// The next guest always receives a fresh copy of the template, so nothing a
// guest does can ever be seen by another visitor or survive their session.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Customer from "../models/Customer.js";
import Record from "../models/Record.js";
import StockWorkspace from "../models/stockModel.js";
import OverdueEntry from "../models/overdueModel.js";
import PaymentHistory from "../models/paymentHistoryModel.js";
import PriceListWorkspace from "../models/priceListModel.js";
import PriceListCustomer from "../models/priceListCustomerModel.js";
import EcofastEntry from "../models/EcofastEntry.js";
import { seedDemoData } from "./demoSeed.js";

// Every collection that stores per-user data, and the field that points to the owner.
// ⚠ If you add a new per-user model, add it here too (otherwise a guest would not get
//   a copy of it, and its data would not be wiped on logout).
const DATA_MODELS = [
  { name: "customers", Model: Customer, field: "user" },
  { name: "records", Model: Record, field: "user" },
  { name: "stock", Model: StockWorkspace, field: "owner" },
  { name: "overdues", Model: OverdueEntry, field: "user" },
  { name: "payments", Model: PaymentHistory, field: "user" },
  { name: "priceList", Model: PriceListWorkspace, field: "owner" },
  { name: "priceListCustomers", Model: PriceListCustomer, field: "owner" },
  { name: "ecofast", Model: EcofastEntry, field: "user" },
];

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
export const GUEST_TTL_MINUTES = num(process.env.GUEST_TTL_MINUTES, 180);
const MAX_ACTIVE_GUESTS = num(process.env.MAX_ACTIVE_GUESTS, 200);
const RESEED_DAYS = num(process.env.DEMO_RESEED_DAYS, 3);
const TEMPLATE_EMAIL = "demo-template@guest.local";

// ── delete everything a user owns ────────────────────────────────────────────
export async function purgeUserData(userId) {
  await Promise.all(
    DATA_MODELS.map(({ Model, field }) => Model.deleteMany({ [field]: userId })),
  );
}

// Deletes a GUEST user and all of its data. Refuses to touch real accounts.
export async function purgeGuest(userId) {
  const user = await User.findById(userId).select("isGuest");
  if (!user || !user.isGuest) return false;
  await purgeUserData(user._id);
  await User.deleteOne({ _id: user._id, isGuest: true });
  return true;
}

// Removes sandboxes that were never logged out (tab closed, expired session).
export async function sweepExpiredGuests() {
  const expired = await User.find({
    isGuest: true,
    guestExpiresAt: { $lt: new Date() },
  })
    .select("_id")
    .limit(200)
    .lean();
  for (const g of expired) {
    try {
      await purgeGuest(g._id);
    } catch (e) {
      console.error("Guest sweep failed for", g._id, e.message);
    }
  }
  return expired.length;
}

export function startGuestSweeper() {
  const run = () =>
    sweepExpiredGuests().catch((e) => console.error("Guest sweep error:", e.message));
  run();
  const timer = setInterval(run, 10 * 60 * 1000);
  timer.unref?.(); // never keep the process alive just for the sweeper
}

// ── demo template (the source every guest is copied from) ────────────────────
// DEMO_TEMPLATE_EMAIL (optional): copy from an existing account instead of the built-in
// sample data. ⚠ Everything in that account becomes visible to every guest.
let seeding = null;
async function getTemplateUser() {
  const custom = (process.env.DEMO_TEMPLATE_EMAIL || "").trim().toLowerCase();
  if (custom) {
    const u = await User.findOne({ email: custom });
    if (!u) throw new Error(`DEMO_TEMPLATE_EMAIL account not found: ${custom}`);
    return u;
  }

  let tpl = await User.findOne({ isDemoTemplate: true });
  const stale =
    tpl && Date.now() - tpl.updatedAt.getTime() > RESEED_DAYS * 86400000;
  if (tpl && !stale) return tpl;

  // one seeding at a time (many guests may arrive together right after a deploy)
  if (!seeding) {
    seeding = (async () => {
      try {
        if (!tpl) {
          try {
            tpl = await User.create({
              name: "Demo Template",
              email: TEMPLATE_EMAIL,
              password: crypto.randomBytes(32).toString("hex"), // not a bcrypt hash → nobody can log in
              isVerified: true,
              isDemoTemplate: true,
            });
          } catch (e) {
            if (e?.code !== 11000) throw e; // someone else created it first
            tpl = await User.findOne({ isDemoTemplate: true });
          }
        }
        await purgeUserData(tpl._id);
        await seedDemoData(tpl._id);
        await User.updateOne({ _id: tpl._id }, { $set: { updatedAt: new Date() } });
        return tpl;
      } finally {
        seeding = null;
      }
    })();
  }
  return seeding;
}

// ── copy the template's data to a guest (all new _ids) ───────────────────────
async function cloneTemplateData(templateId, guestId) {
  // OverdueEntry ids are referenced by PaymentHistory.allocations[].entryId → keep them in sync
  const overdueIdMap = new Map();

  for (const { Model, field, name } of DATA_MODELS) {
    const docs = await Model.collection.find({ [field]: templateId }).toArray();
    if (!docs.length) continue;

    const copies = docs.map((d) => {
      const copy = { ...d, [field]: guestId };
      const newId = new mongoose.Types.ObjectId();
      if (name === "overdues") overdueIdMap.set(String(d._id), newId);
      copy._id = newId;
      return copy;
    });

    if (name === "payments") {
      for (const c of copies) {
        c.allocations = (c.allocations || []).map((a) => ({
          ...a,
          entryId: overdueIdMap.get(String(a.entryId)) || a.entryId,
        }));
      }
    }
    await Model.collection.insertMany(copies, { ordered: true });
  }
}

// ── create a guest sandbox ───────────────────────────────────────────────────
export async function createGuestSandbox() {
  const active = await User.countDocuments({
    isGuest: true,
    guestExpiresAt: { $gt: new Date() },
  });
  if (active >= MAX_ACTIVE_GUESTS) {
    const err = new Error("The demo is busy right now. Please try again in a few minutes.");
    err.status = 503;
    throw err;
  }

  const template = await getTemplateUser();
  const id = crypto.randomBytes(6).toString("hex");
  const guest = await User.create({
    name: "Guest",
    email: `guest-${id}@guest.local`,
    password: crypto.randomBytes(32).toString("hex"), // not a bcrypt hash → cannot be used to log in
    isVerified: true,
    isGuest: true,
    guestExpiresAt: new Date(Date.now() + GUEST_TTL_MINUTES * 60 * 1000),
  });

  try {
    await cloneTemplateData(template._id, guest._id);
  } catch (e) {
    await purgeGuest(guest._id).catch(() => {}); // never leave a half-copied sandbox behind
    throw e;
  }
  return guest;
}
