// features/keyCustomers/useKeyCustomers.js
// State actions for the feature: call the API, update the shared `customers` map,
// toast the result. The page/components stay presentational.
import { useCallback, useMemo, useState } from "react";
import { setKeyFlag, setVisitDays } from "./keyCustomersApi";

/**
 * @param {object}   p
 * @param {Object<string, object>} p.customers      map name → customer (must contain `_id`)
 * @param {Function} p.setCustomers                 React state setter for that map
 * @param {Function} p.showToast                    (message, "success" | "error") => void
 * @returns {{ saving: boolean,
 *             setKey: (names: string[], value: boolean) => Promise<boolean>,
 *             setFrequency: (name: string, days: number) => Promise<boolean> }}
 */
export function useKeyCustomers({ customers, setCustomers, showToast }) {
  const [saving, setSaving] = useState(false);

  const setKey = useCallback(
    async (names, value) => {
      const ids = names.map((n) => customers[n]?._id).filter(Boolean);
      if (!ids.length) {
        showToast("Customer ID not found.", "error");
        return false;
      }
      setSaving(true);
      try {
        await setKeyFlag(ids, value);
        setCustomers((prev) => {
          const next = { ...prev };
          names.forEach((n) => {
            if (next[n]) next[n] = { ...next[n], isKey: value };
          });
          return next;
        });
        const label = names.length === 1 ? names[0] : `${names.length} customers`;
        showToast(
          value ? `${label} added to Key Customers` : `${label} removed from Key Customers`,
        );
        return true;
      } catch (err) {
        showToast(err.message, "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [customers, setCustomers, showToast],
  );

  // optimistic: the dropdown changes instantly, rolls back if the server refuses
  const setFrequency = useCallback(
    async (name, days) => {
      const id = customers[name]?._id;
      if (!id) {
        showToast("Customer ID not found.", "error");
        return false;
      }
      const previous = customers[name]?.keyVisitDays;
      const apply = (value) =>
        setCustomers((prev) => ({ ...prev, [name]: { ...prev[name], keyVisitDays: value } }));
      apply(days);
      setSaving(true);
      try {
        await setVisitDays(id, days);
        showToast(`${name}: visit every ${days} days`);
        return true;
      } catch (err) {
        apply(previous);
        showToast(err.message, "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [customers, setCustomers, showToast],
  );

  return useMemo(() => ({ saving, setKey, setFrequency }), [saving, setKey, setFrequency]);
}
