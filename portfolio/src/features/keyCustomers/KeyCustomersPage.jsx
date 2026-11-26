// features/keyCustomers/KeyCustomersPage.jsx   — route: /DailySalesReport/key-customers
// Container: owns UI state (sort / filter / search / panel), derives rows with the pure
// functions from keyStatus.js and composes the presentational components.
import { useMemo, useState } from "react";
import { Icon, PageShell, SectionCard } from "../dsr/shared";
import {
  partitionCustomers,
  buildKeyRows,
  countRows,
  filterRows,
  sortRows,
} from "./keyStatus";
import { exportKeyCustomers } from "./exportKeyCustomers";
import { AddKeyCustomersPanel } from "./components/AddKeyCustomersPanel";
import { KeyListControls } from "./components/KeyListControls";
import { KeyCustomerRow } from "./components/KeyCustomerRow";
import { KeyEmptyState } from "./components/KeyEmptyState";
import { goldButtonStyle } from "./components/styles";
import "./keyCustomers.css";

/**
 * @param {object} props
 * @param {Object<string, object>} props.customers      name → customer
 * @param {Object<string, object[]>} props.historyMap   name → visits (newest first)
 * @param {{saving: boolean, setKey: Function, setFrequency: Function}} props.actions  from useKeyCustomers
 * @param {(msg: string, type?: string) => void} props.showToast
 * @param {Function} props.onBack
 * @param {(name: string) => void} props.onOpenCustomer   open visit history
 * @param {(name: string) => void} props.onAddVisit       start a new visit for that customer
 * @param {Function} props.onNewCustomer
 */
export function KeyCustomersPage({
  customers,
  historyMap,
  actions,
  showToast,
  onBack,
  onOpenCustomer,
  onAddVisit,
  onNewCustomer,
}) {
  const { saving, setKey, setFrequency } = actions;

  const [sort, setSort] = useState("attention");
  const [chip, setChip] = useState("all");
  const [query, setQuery] = useState("");

  const { allNames, keyNames, otherNames } = useMemo(() => partitionCustomers(customers), [customers]);
  // open the add panel straight away while there are no key customers yet
  const [adding, setAdding] = useState(keyNames.length === 0 && allNames.length > 0);

  const base = useMemo(
    () => buildKeyRows({ names: keyNames, customers, historyMap }),
    [keyNames, customers, historyMap],
  );
  const counts = useMemo(() => countRows(base), [base]);
  const rows = useMemo(
    () => sortRows(filterRows(base, { query, chip }), sort),
    [base, query, chip, sort],
  );

  const handleAdd = async (names) => {
    const ok = await setKey(names, true);
    if (ok) setAdding(false);
    return ok;
  };

  const handleDownload = () => {
    const n = exportKeyCustomers({ customers, names: rows.map((r) => r.name), historyMap });
    showToast(`Downloading Excel! (${n} key customer${n !== 1 ? "s" : ""})`);
  };

  const emptyListText = query.trim()
    ? `No key customers match "${query}".`
    : chip === "due"
      ? "No overdue visits — all key customers are on track."
      : "All key customers have been visited this month.";

  return (
    <PageShell
      title="Key Customers"
      subtitle={
        keyNames.length
          ? `${keyNames.length} priority account${keyNames.length !== 1 ? "s" : ""} · tap a customer for visit history`
          : "Your priority accounts — track them closely"
      }
      onBack={onBack}
      maxWidth={900}
      actions={
        <button style={goldButtonStyle} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          <Icon name={adding ? "close" : "addRecord"} size={13} strokeWidth={2} />
          {adding ? "Close" : "Add customers"}
        </button>
      }
    >
      {allNames.length === 0 ? (
        <KeyEmptyState
          icon="store"
          title="No customers yet"
          text="Add customers first, then mark your key accounts."
          actionLabel="Add customer"
          onAction={onNewCustomer}
        />
      ) : (
        <>
          {adding && (
            <AddKeyCustomersPanel
              customers={customers}
              otherNames={otherNames}
              saving={saving}
              onAdd={handleAdd}
              onNewCustomer={onNewCustomer}
            />
          )}

          {keyNames.length === 0 ? (
            !adding && (
              <KeyEmptyState
                icon="star"
                title="No key customers yet"
                text="Pick your priority accounts to keep them in one place."
                actionLabel="Add customers"
                onAction={() => setAdding(true)}
              />
            )
          ) : (
            <SectionCard>
              <KeyListControls
                total={keyNames.length}
                shown={rows.length}
                counts={counts}
                sort={sort}
                chip={chip}
                query={query}
                onSort={setSort}
                onChip={setChip}
                onQuery={setQuery}
                onDownload={handleDownload}
              />
              {rows.length === 0 && (
                <div className="p-5.5 text-center text-[12.5px] text-ds-text2">
                  {emptyListText}
                </div>
              )}
              {rows.map((row, i) => (
                <KeyCustomerRow
                  key={row.name}
                  row={row}
                  index={i}
                  saving={saving}
                  onOpen={onOpenCustomer}
                  onAddVisit={onAddVisit}
                  onSetFrequency={setFrequency}
                  onRemove={(name) => setKey([name], false)}
                />
              ))}
            </SectionCard>
          )}
        </>
      )}
    </PageShell>
  );
}
