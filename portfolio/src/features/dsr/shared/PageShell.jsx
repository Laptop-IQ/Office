// features/dsr/shared/PageShell.jsx
// Page frame for DSR sub-pages:  Back  →  title block (+ actions on the right)  →  divider  →  content / aside.
import { Icon } from "./Icon";

/**
 * @param {object} props
 * @param {string} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.avatar]     round badge left of the title (initials …)
 * @param {React.ReactNode} [props.badge]      small element right after the title block
 * @param {() => void}      props.onBack
 * @param {React.ReactNode} [props.actions]    buttons shown at the right end of the title row
 * @param {React.ReactNode} [props.aside]      sticky right column (wide screens)
 * @param {number}          [props.maxWidth]
 */
export const PageShell = ({
  title,
  subtitle,
  avatar,
  badge,
  onBack,
  actions,
  aside,
  children,
  maxWidth = 1180,
}) => (
  <div className="dsr-pages min-h-screen bg-ds-bg text-ds-text1">
    <div className="dsr-page-enter pt-5 pb-[72px] px-4 mx-auto" style={{ maxWidth }}>
      <button type="button" className="dsr-back-btn mb-5" onClick={onBack}>
        <Icon name="back" size={14} strokeWidth={2.2} /> Back
      </button>

      <div className="flex items-end gap-4 flex-wrap mb-5">
        {avatar && (
          <div className="flex items-center justify-center shrink-0 w-[58px] h-[58px] text-[18px] font-semibold bg-ds-surface text-ds-primary rounded-[50%] border border-solid border-ds-primary">
            {avatar}
          </div>
        )}
        <div className="flex-[1_1_240px] min-w-0">
          <h1 className="dsr-display m-0 text-[clamp(22px,4.2vw,34px)] leading-[1.15] [word-break:break-word] text-ds-text1">
            {title}
          </h1>
          {subtitle && <div className="mt-[5px] text-[12.5px] text-ds-text2">{subtitle}</div>}
        </div>
        {badge}
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>

      <hr className="dsr-gold-rule mb-5.5" />
      <div className={`dsr-page-grid${aside ? " has-aside" : ""}`}>
        <div className="min-w-0">{children}</div>
        {aside && <aside className="dsr-aside-sticky">{aside}</aside>}
      </div>
    </div>
  </div>
);
