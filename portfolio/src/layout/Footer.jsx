// layout/Footer.jsx
import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: "1px solid var(--footer-line, rgba(237,237,237,0.08))",
        background: "var(--footer-bg, #141415)",
        color: "var(--footer-text, #85858b)",
        fontSize: 13,
      }}
    >
      <p style={{ margin: 0 }}>&copy; {currentYear} My Office Workplace</p>
    </footer>
  );
}
