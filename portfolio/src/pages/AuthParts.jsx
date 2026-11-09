// Shared pieces for the auth pages (sign in, register, verify, forgot, reset).
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./auth.css";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap";

function useFonts() {
  React.useEffect(() => {
    if (document.getElementById("hq-fonts")) return;
    const link = document.createElement("link");
    link.id = "hq-fonts";
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.append(link);
  }, []);
}

export function AuthLayout({ title, subtitle, back, children, footer }) {
  useFonts();

  return (
    <div className="au">
      <header className="au-header">
        <div className="au-header-inner">
          <Link to="/" className="au-brand">
            <span className="au-brand-mark" aria-hidden="true" />
            My Office Workplace
          </Link>
          {back && (
            <Link to={back.to} state={back.state} className="au-back">
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
              {back.label}
            </Link>
          )}
        </div>
      </header>

      <main className="au-main">
        <div className="au-card">
          <h1 className="au-title">{title}</h1>
          {subtitle && <p className="au-sub">{subtitle}</p>}
          {children}
          {footer && <div className="au-foot-row">{footer}</div>}
        </div>
      </main>

      <p className="au-copy">&copy; {new Date().getFullYear()} My Office Workplace</p>
    </div>
  );
}

/** Label, optional side link, icon and input in one block. */
export function Field({ id, label, icon: Icon, side, state, hint, hintTone, trailing, ...inputProps }) {
  return (
    <div className="au-field">
      <div className="au-label-row">
        <label htmlFor={id} className="au-label">
          {label}
        </label>
        {side}
      </div>
      <div className="au-input-wrap">
        {Icon && <Icon className="au-icon" size={18} strokeWidth={1.5} aria-hidden="true" />}
        <input id={id} className="au-input" data-state={state} {...inputProps} />
        {trailing}
      </div>
      {hint && (
        <p className="au-hint" data-tone={hintTone} role={hintTone === "bad" ? "alert" : undefined}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ show, onToggle, toggleLabel, ...props }) {
  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          className="au-eye"
          onClick={onToggle}
          aria-label={toggleLabel[show ? "hide" : "show"]}
        >
          {show ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
        </button>
      }
    />
  );
}

export function SubmitButton({ loading, loadingText, children, ...rest }) {
  return (
    <button type="submit" className="au-btn" disabled={loading || rest.disabled} {...rest}>
      {loading ? (
        <>
          <span className="au-spinner" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function OtpRow({ otp, refs, onChange, onKeyDown, onPaste, idPrefix = "otp" }) {
  return (
    <div className="au-otp" onPaste={onPaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (refs.current[index] = el)}
          id={`${idPrefix}-${index}`}
          className="au-otp-input"
          data-filled={digit ? "true" : "false"}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? 6 : 1}
          value={digit}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

/* Password strength: label, bar colour and width. */
export const getPasswordStrength = (password) => {
  if (!password) return { label: "", tone: "var(--muted)", width: "0%" };
  if (password.length < 6) return { label: "Weak", tone: "var(--bad)", width: "25%" };
  if (password.length < 8) return { label: "Fair", tone: "var(--accent)", width: "50%" };

  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (score >= 2) return { label: "Strong", tone: "var(--ok)", width: "100%" };
  return { label: "Good", tone: "var(--text-2)", width: "75%" };
};

export function StrengthMeter({ strength }) {
  if (!strength.label) return null;
  return (
    <div className="au-strength">
      <div className="au-strength-row">
        <span>Password strength</span>
        <b style={{ color: strength.tone }}>{strength.label}</b>
      </div>
      <div className="au-track">
        <div className="au-fill" style={{ width: strength.width, "--tone": strength.tone }} />
      </div>
    </div>
  );
}
