// features/keyCustomers/components/KeyViewSwitch.jsx
// "All customers | ★ Key customers (n)" switch shown at the top of the Customer Master card.
import { Icon } from "../../dsr/shared";
import "../keyCustomers.css";

const Count = ({ n }) => <span className="ml-1.5 font-normal opacity-70">{n}</span>;

/**
 * @param {object} props
 * @param {"all"|"key"} props.view
 * @param {(view: "all"|"key") => void} props.onChange
 * @param {number} props.total      all customers
 * @param {number} props.keyCount   key customers
 */
export function KeyViewSwitch({ view, onChange, total, keyCount }) {
  return (
    <div className="kc-seg" role="group" aria-label="Customer view">
      <button
        type="button"
        className={`h-[30px] px-3.5 text-[13px]${view === "all" ? " on" : ""}`}
        aria-pressed={view === "all"}
        onClick={() => onChange("all")}
      >
        All customers
        <Count n={total} />
      </button>
      <button
        type="button"
        className={`h-[30px] px-3.5 text-[13px] inline-flex items-center gap-1.5${view === "key" ? " on" : ""}`}
        aria-pressed={view === "key"}
        onClick={() => onChange("key")}
      >
        <Icon name="star" size={13} strokeWidth={2.1} />
        Key customers
        <Count n={keyCount} />
      </button>
    </div>
  );
}
