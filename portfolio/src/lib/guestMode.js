// lib/guestMode.js
// ─────────────────────────────────────────────────────────────────────────────
// Guest demo – browser side.
//
// While a guest is signed in, `window.localStorage` is redirected to
// `sessionStorage` (only the "theme" key still uses the real localStorage).
// Everything the app saves "on this device" (stock cache, price list, drafts,
// saved orders, token ...) therefore lives in the guest's tab only:
//   • it never mixes with a real user's data in the same browser, and
//   • it disappears when the guest logs out or closes the tab.
//
// This file MUST be the first import of main.jsx, so the redirect is in place
// before any other module reads localStorage.
// ─────────────────────────────────────────────────────────────────────────────
const FLAG = "sf_guest_mode";
const PASS_THROUGH = new Set(["theme"]); // keep the light/dark choice

const realLocal = window.localStorage;
const session = window.sessionStorage;

export const isGuestMode = () => {
  try {
    return session.getItem(FLAG) === "1";
  } catch {
    return false;
  }
};

const guestStorage = {
  getItem: (k) => (PASS_THROUGH.has(k) ? realLocal.getItem(k) : session.getItem(k)),
  setItem: (k, v) =>
    PASS_THROUGH.has(k) ? realLocal.setItem(k, v) : session.setItem(k, v),
  removeItem: (k) =>
    PASS_THROUGH.has(k) ? realLocal.removeItem(k) : session.removeItem(k),
  clear: () => {
    session.clear();
    session.setItem(FLAG, "1"); // stay in guest mode
  },
  key: (i) => session.key(i),
  get length() {
    return session.length;
  },
};

if (isGuestMode()) {
  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => guestStorage,
    });
  } catch (e) {
    console.warn("Guest storage redirect failed:", e);
  }
}

// Called right after the server created the sandbox. The caller reloads the page afterwards,
// so the redirect above is installed from the very first line of the app.
export function enterGuestMode(token) {
  session.setItem(FLAG, "1");
  session.setItem("token", token);
}

// Called on logout: forgets everything the guest saved in this tab.
export function leaveGuestMode() {
  session.clear();
}
