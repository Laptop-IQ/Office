// features/keyCustomers/components/KeyEmptyState.jsx
import { Icon } from "../../dsr/shared";
import { goldButton } from "./styles";

export function KeyEmptyState({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="text-center py-9 px-4 text-ds-text2">
      <div className="dsr-empty-icon">
        <Icon name={icon} size={26} strokeWidth={1.6} className="text-ds-primary" />
      </div>
      <div className="text-[14.5px] font-semibold text-ds-text1">{title}</div>
      <div className="text-[12px] mt-1 mb-3.5">{text}</div>
      <button className={goldButton} onClick={onAction}>
        <Icon name="addRecord" size={13} strokeWidth={2} /> {actionLabel}
      </button>
    </div>
  );
}
