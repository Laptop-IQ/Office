// lib/userScopedStorage.js
// ─────────────────────────────────────────────────────────────────────────────
// Per-user isolation of everything the app keeps in localStorage.
//
// Without this, two people using the same browser share the same keys (saved
// purchase orders, customer names, drafts, price-list page data ...), so user B
// could see user A's data after A logged out.
//
// Every key except the pass-through ones is transparently stored as
//   sfu:<userId>:<key>
// where <userId> comes from the logged-in user's JWT. A different login simply
// sees a different (empty) set of keys; nothing is deleted on logout, so each
// user still finds their own data when they come back.
//
// MUST be imported right AFTER ./guestMode in main.jsx (guest demos already live
// in their own sessionStorage and are left alone here).
// ─────────────────────────────────────────────────────────────────────────────
import { isGuestMode } from "./guestMode";

const PASS_THROUGH = new Set(["token", "theme", "sf_scope_v1"]);
const PREFIX = "sfu:";
const MARK = "sf_scope_v1";
const HEX_ID_SUFFIX = /_([0-9a-f]{24})$/;

function install() {
  if (isGuestMode()) return;

  const real = window.localStorage;
  const session = window.sessionStorage;

  const userId = () => {
    try {
      const token = real.getItem("token") || session.getItem("token");
      if (!token) return "";
      const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
      return String(JSON.parse(atob(padded)).id || "");
    } catch {
      return "";
    }
  };
  const scope = () => `${PREFIX}${userId() || "anon"}:`;
  const mine = () => {
    const p = scope();
    const out = [];
    for (let i = 0; i < real.length; i++) {
      const k = real.key(i);
      if (k && k.startsWith(p)) out.push(k);
    }
    return out;
  };

  // One-time: keys written by the old (unscoped) version. They cannot be tied to
  // a user, so they go to whoever is logged in right now (the person who was using
  // this browser); if nobody is logged in they are discarded, never handed to the
  // next person who logs in. Keys that already carry ANOTHER user's id are dropped.
  try {
    if (!real.getItem(MARK)) {
      const id = userId();
      const legacy = [];
      for (let i = 0; i < real.length; i++) {
        const k = real.key(i);
        if (k && !PASS_THROUGH.has(k) && !k.startsWith(PREFIX)) legacy.push(k);
      }
      legacy.forEach((k) => {
        const v = real.getItem(k);
        real.removeItem(k);
        const m = k.match(HEX_ID_SUFFIX);
        if (id && v !== null && !(m && m[1] !== id)) {
          try {
            real.setItem(`${PREFIX}${id}:${k}`, v);
          } catch {
            /* quota — skip */
          }
        }
      });
      real.setItem(MARK, "1");
    }
  } catch {
    /* storage unavailable */
  }

  const scoped = {
    getItem: (k) =>
      PASS_THROUGH.has(k) ? real.getItem(k) : real.getItem(scope() + k),
    setItem: (k, v) =>
      PASS_THROUGH.has(k) ? real.setItem(k, v) : real.setItem(scope() + k, v),
    removeItem: (k) =>
      PASS_THROUGH.has(k) ? real.removeItem(k) : real.removeItem(scope() + k),
    clear: () => mine().forEach((k) => real.removeItem(k)),
    key: (i) => {
      const p = scope();
      const k = mine()[i];
      return k ? k.slice(p.length) : null;
    },
    get length() {
      return mine().length;
    },
  };

  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => scoped,
    });
  } catch (e) {
    console.warn("User-scoped storage could not be installed:", e);
  }
}

install();
