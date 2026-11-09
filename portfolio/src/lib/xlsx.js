/**
 * Lazy Excel engine.
 *
 * `xlsx-js-style` is ~400 KB. Importing it statically put it in the main
 * bundle for every visitor (home page, login, …). Instead it lives in its own
 * chunk and is loaded on demand:
 *   • `loadXLSX()`  – async, returns the library (cached).
 *   • `XLSX`        – synchronous proxy with the same API (`XLSX.utils…`,
 *                     `XLSX.read`, `XLSX.write`). It works as soon as the
 *                     library has been loaded; route loaders in App.jsx await
 *                     `loadXLSX()` in parallel with the page chunk, so by the
 *                     time a page renders it is ready.
 * xlsx-js-style is a superset of SheetJS (`xlsx`), so a single copy now serves
 * every page (previously two copies were bundled).
 */
let lib = null;
let pending = null;

export const loadXLSX = () =>
  pending ||
  (pending = import("xlsx-js-style").then((m) => {
    lib = m.utils ? m : m.default;
    return lib;
  }));

export const XLSX = new Proxy(
  {},
  {
    get(_, key) {
      if (!lib) {
        throw new Error("The Excel engine is still loading — please try again in a moment.");
      }
      return lib[key];
    },
  },
);
