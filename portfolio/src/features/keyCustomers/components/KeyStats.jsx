// features/keyCustomers/components/KeyStats.jsx
// Three headline numbers + the monthly-coverage progress bar.
import { DS, fmtL } from "../../dsr/shared";
import { coverageTone } from "../keyStatus";
import { toneColor } from "./styles";

const StatCard = ({ label, value, color }) => (
  <div
    style={{
      flex: "1 1 140px",
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 12,
      padding: "12px 14px",
    }}
  >
    <div style={{ fontSize: 12, color: DS.text2 }}>{label}</div>
    <div className="dsr-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color }}>
      <span key={String(value)} className="dsr-pop">
        {value}
      </span>
    </div>
  </div>
);

/** @param {{ summary: ReturnType<typeof import("../keyStatus").summarize> }} props */
export function KeyStats({ summary }) {
  const color = toneColor[coverageTone(summary.pct)];
  return (
    <>
      <div className="dsr-rise" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <StatCard label="Key customers" value={summary.total} color={DS.primary} />
        <StatCard
          label="Overdue visits"
          value={summary.overdue}
          color={summary.overdue ? DS.warning : DS.success}
        />
        <StatCard label="Potential / mth" value={fmtL(summary.potential)} color={DS.text1} />
      </div>

      <div
        className="dsr-rise"
        style={{
          background: DS.card,
          border: `1px solid ${DS.border}`,
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 8,
            fontSize: 12,
          }}
        >
          <span style={{ color: DS.text2 }}>
            Visited this month ·{" "}
            <b className="dsr-mono" style={{ color: DS.text1 }}>
              {summary.visited} of {summary.total}
            </b>
          </span>
          <b className="dsr-mono" style={{ color }}>
            {summary.pct}%
          </b>
        </div>
        <div
          className="kc-bar"
          role="progressbar"
          aria-valuenow={summary.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Key customers visited this month"
        >
          <i style={{ width: `${summary.pct}%`, background: color }} />
        </div>
      </div>
    </>
  );
}
