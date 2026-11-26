// features/dsr/shared/SectionCard.jsx
import { DS } from "./tokens";

export const SectionCard = ({ title, children, style }) => (
  <div
    style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 14,
      padding: "17px",
      marginBottom: 14,
      boxShadow: "var(--ds-shadow-card)",
      ...style,
    }}
  >
    {title && (
      <div
        className="mb-3.5 text-[12px] font-semibold text-ds-text3"
      >
        {title}
      </div>
    )}
    {children}
  </div>
);
