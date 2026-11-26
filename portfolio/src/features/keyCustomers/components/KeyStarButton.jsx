// features/keyCustomers/components/KeyStarButton.jsx
// ⭐ toggle used by the Customer Master rows and the Key Customers list.
import { Icon } from "../../dsr/shared";
import "../keyCustomers.css";

/**
 * @param {object}   props
 * @param {string}   props.name       customer name (for the accessible label)
 * @param {boolean}  props.isKey      current state
 * @param {Function} props.onToggle   (nextIsKey: boolean) => void
 * @param {boolean}  [props.disabled]
 * @param {"sm"|"md"} [props.size]
 */
export function KeyStarButton({ name, isKey, onToggle, disabled = false, size = "md", style, className = "" }) {
  return (
    <button
      type="button"
      className={`kc-star${size === "sm" ? " sm" : ""}${isKey ? " on" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      aria-pressed={!!isKey}
      aria-label={isKey ? `Remove ${name} from key customers` : `Mark ${name} as key customer`}
      title={isKey ? "Key customer — tap to remove" : "Mark as key customer"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation(); // never trigger the surrounding row's click
        onToggle(!isKey);
      }}
    >
      <Icon name="star" size={size === "sm" ? 13 : 16} strokeWidth={2} />
    </button>
  );
}
