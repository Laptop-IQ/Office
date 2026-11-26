// features/keyCustomers/components/AddKeyCustomersPanel.jsx
// Multi-select list of the customers that are NOT yet key customers.
import { useMemo, useState } from "react";
import { Icon, SectionCard, StageLadder } from "../../dsr/shared";
import { addCandidates } from "../keyStatus";
import { goldButtonBase } from "./styles";

/**
 * @param {object}   props
 * @param {Object<string, object>} props.customers
 * @param {string[]} props.otherNames       names that are not key yet
 * @param {boolean}  props.saving
 * @param {(names: string[]) => Promise<boolean>} props.onAdd   resolves true on success
 * @param {Function} props.onNewCustomer
 */
export function AddKeyCustomersPanel({ customers, otherNames, saving, onAdd, onNewCustomer }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState(() => new Set());

  const { matches, shown, hiddenCount } = useMemo(
    () => addCandidates(otherNames, customers, { query, showAll }),
    [otherNames, customers, query, showAll],
  );
  const pickedNames = [...picked].filter((n) => otherNames.includes(n));

  const toggle = (name) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const submit = async () => {
    if (!pickedNames.length) return;
    if (await onAdd(pickedNames)) {
      setPicked(new Set());
      setQuery("");
    }
  };

  const ready = pickedNames.length > 0;

  return (
    <div className="dsr-reveal">
      <SectionCard>
        <div
          className="flex items-center gap-[7px] mb-3 text-[14px] font-semibold text-ds-text1"
        >
          <Icon name="star" size={15} className="text-ds-primary" />
          Add to Key Customers
          <span className="text-[12px] font-normal text-ds-text2">
            {otherNames.length} available
          </span>
        </div>

        {otherNames.length === 0 ? (
          <div className="p-5.5 text-center text-[12.5px] text-ds-text2">
            Every customer is already a key customer.
          </div>
        ) : (
          <>
            <div className="relative mb-2.5">
              <Icon name="search" size={14} className="absolute top-3 left-3 text-ds-text3" />
              <input
                className="dsr-input dsr-field h-10 pl-8.5"

                placeholder="Search name, area, distributor, mobile…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div
              className="max-h-[min(340px,_50vh)] rounded-[10px] border border-solid border-ds-border overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]"
            >
              {shown.length === 0 ? (
                <div className="p-5.5 text-center text-[12.5px] text-ds-text2">
                  {`No customers match "${query}".`}
                </div>
              ) : (
                shown.map((name) => {
                  const c = customers[name];
                  const on = picked.has(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      className={`kc-pick${on ? " on" : ""}`}
                      onClick={() => toggle(name)}
                    >
                      <span className="kc-box" aria-hidden="true">
                        <Icon name="check" size={13} strokeWidth={3} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className="block text-[13px] font-semibold text-ellipsis whitespace-nowrap text-ds-text1 overflow-hidden"
                        >
                          {name}
                        </span>
                        <span className="block text-[12px] text-ds-text2">
                          {c.area} · {c.distributor}
                          {c.contactPerson ? ` · ${c.contactPerson}` : ""}
                        </span>
                      </span>
                      <StageLadder stage={c.stage} size="sm" />
                    </button>
                  );
                })
              )}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  className="kc-pick justify-center font-semibold text-[12.5px] text-ds-primary"

                  onClick={() => setShowAll(true)}
                >
                  Show all {matches.length} customers
                </button>
              )}
            </div>

            <div
              className="flex items-center justify-between gap-2 flex-wrap mt-3"
            >
              <div className="flex gap-1.5 items-center flex-wrap">
                <button
                  type="button"
                  className="dsr-ghost-btn h-8 text-[12px]"

                  disabled={shown.length === 0}
                  onClick={() => setPicked(new Set([...picked, ...shown]))}
                >
                  Select shown ({shown.length})
                </button>
                {picked.size > 0 && (
                  <button
                    type="button"
                    className="dsr-ghost-btn h-8 text-[12px]"

                    onClick={() => setPicked(new Set())}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNewCustomer}
                  className="text-[12px] underline [background:none] text-ds-text2 border-0 cursor-pointer"
                >
                  Not in list? Add new customer
                </button>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={saving || !ready}
                className={`${goldButtonBase} h-9 ${
                  ready
                    ? "bg-ds-primary text-[#1a1405] border-[rgba(212,175,106,0.25)]"
                    : "bg-[rgba(212,175,106,0.10)] text-ds-text3 border-[rgba(212,175,106,0.25)]"
                } ${saving ? "opacity-70" : ""} ${ready && !saving ? "cursor-pointer" : "cursor-default"}`}
              >
                <Icon name="star" size={13} strokeWidth={2.2} />
                {saving
                  ? "Saving…"
                  : ready
                    ? `Add ${pickedNames.length} to Key Customers`
                    : "Select customers"}
              </button>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
