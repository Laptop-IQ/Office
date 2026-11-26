// features/keyCustomers/components/KeyCustomerRow.jsx
// One key customer: status, last note, quick actions (log visit / call / WhatsApp), frequency.
import {
  Icon,
  StageLadder,
  getInitials,
  isValidMobile,
  fmtMobile,
} from "../../dsr/shared";
import { statusText, frequencyOptions } from "../keyStatus";
import { KeyStarButton } from "./KeyStarButton";

/**
 * @param {object} props
 * @param {ReturnType<typeof import("../keyStatus").buildKeyRows>[number]} props.row
 * @param {number} props.index                 for the staggered entrance animation
 * @param {boolean} props.saving
 * @param {(name: string) => void} props.onOpen
 * @param {(name: string) => void} props.onAddVisit
 * @param {(name: string, days: number) => void} props.onSetFrequency
 * @param {(name: string) => void} props.onRemove
 */
export function KeyCustomerRow({ row, index, saving, onOpen, onAddVisit, onSetFrequency, onRemove }) {
  const { name, c, last, gap, due, visits } = row;
  const mobileOk = isValidMobile(c.mobile);
  const lastNote = last?.outcome || last?.objective || "";

  return (
    <div
      className={`dsr-customer-row dsr-rise flex items-start gap-2.5 py-[11px] px-2 rounded-lg border-b border-solid border-b-ds-border ${due ? "[box-shadow:inset_3px_0_0_var(--ds-warning)]" : "[box-shadow:none]"}`}
      role="button"
      tabIndex={0}
      title="Visit history dekhein"
      onClick={() => onOpen(name)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return; // ignore keys pressed on inner controls
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(name);
        }
      }}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <div
        className="flex items-center justify-center shrink-0 w-[38px] h-[38px] text-[12px] font-semibold bg-ds-surface text-ds-primary rounded-[50%] border border-solid border-ds-primary"
      >
        {getInitials(name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ellipsis whitespace-nowrap text-ds-text1 overflow-hidden">
          {name}
        </div>
        <div className="mt-[1px] text-[12px] text-ds-text2">
          {c.area} · {c.distributor}
          {(c.contactPerson || c.mobile) && (
            <span className="ml-[5px] text-ds-text1">
              · {c.contactPerson}
              {c.contactPerson && c.mobile ? " · " : ""}
              {c.mobile && <span className="dsr-mono">{c.mobile}</span>}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap mt-0.5 text-[12px]">
          <span data-testid="kc-status" className={`font-semibold ${due ? "text-ds-warning" : "text-ds-success"}`}>
            {statusText(row)}
          </span>
          <span className="text-ds-primary">
            · {visits} visit{visits !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-1.5 min-[560px]:hidden">
          <StageLadder stage={c.stage} size="sm" />
        </div>
        {lastNote && (
          <div
            title={lastNote}
            className="mt-0.5 text-[12px] text-ellipsis whitespace-nowrap text-ds-text3 overflow-hidden"
          >
            Last: {lastNote}
          </div>
        )}

        <div
          className="flex gap-1.5 flex-wrap items-center mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="kc-act gold" onClick={() => onAddVisit(name)} title={`Log a visit for ${name}`}>
            <Icon name="addRecord" size={13} strokeWidth={2.1} /> Log visit
          </button>
          <a
            className="kc-act call"
            href={mobileOk ? `tel:+91${c.mobile}` : undefined}
            aria-disabled={!mobileOk}
            aria-label={`Call ${name}`}
            title={mobileOk ? `Call ${fmtMobile(c.mobile)}` : "No valid mobile number"}
          >
            <Icon name="phone" size={13} strokeWidth={2} /> Call
          </a>
          <a
            className="kc-act wa"
            href={mobileOk ? `https://wa.me/91${c.mobile}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!mobileOk}
            aria-label={`WhatsApp ${name}`}
            title={mobileOk ? "Open WhatsApp" : "No valid mobile number"}
          >
            <Icon name="whatsapp" size={13} strokeWidth={2} /> WhatsApp
          </a>
          <select
            className="kc-freq"
            aria-label={`Visit frequency for ${name}`}
            title="How often should this customer be visited?"
            value={gap}
            disabled={saving}
            onChange={(e) => onSetFrequency(name, Number(e.target.value))}
          >
            {frequencyOptions(gap).map((d) => (
              <option key={d} value={d}>
                Visit every {d}d
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* wide screens: ladder in its own column; narrow screens: it moves into the info block */}
      <div className="dsr-cust-ladder self-center hidden min-[560px]:block">
        <StageLadder stage={c.stage} size="sm" />
      </div>
      <KeyStarButton
        name={name}
        isKey
        disabled={saving}
        className="self-center"
        onToggle={() => onRemove(name)}
      />
    </div>
  );
}
