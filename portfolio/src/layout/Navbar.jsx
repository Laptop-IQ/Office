// layout/Navbar.jsx
// ╔══════════════════════════════════════════════════════════╗
//   PREMIUM DARK GLASS EDITION — v2.0
//   Dark glass morphism · Purple–Indigo gradient system
//   Glowing accents · Animated logo · Refined micro-interactions
// ╚══════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  CurrencyRupeeIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  QueueListIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

/* ══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — Premium Dark Glass
   ══════════════════════════════════════════════════════════════════ */
const T = {
  /* Surfaces */
  navBg:       "rgba(8,8,12,0.72)",
  navBgSolid:  "rgba(11,11,16,0.97)",
  dropBg:      "rgba(14,14,20,0.98)",
  drawerBg:    "rgba(11,11,16,0.99)",
  /* Borders */
  border:      "rgba(255,255,255,0.07)",
  borderMd:    "rgba(255,255,255,0.11)",
  /* Text */
  text:        "#f2f2f7",
  muted:       "#8e8e93",
  dim:         "#44444a",
  /* Hover surfaces */
  hover:       "rgba(255,255,255,0.055)",
  itemHv:      "rgba(255,255,255,0.07)",
  /* Accent — purple → indigo */
  accent:      "#7c3aed",
  accent2:     "#a78bfa",
  accentT:     "rgba(124,58,237,0.13)",
  /* Danger */
  red:         "#ff453a",
  redT:        "rgba(255,69,58,0.10)",
  /* Shadows */
  shadow:      "0 20px 60px rgba(0,0,0,0.70), 0 0 0 0.5px rgba(255,255,255,0.06)",
  /* Misc */
  overlay:     "rgba(0,0,0,0.75)",
  font:        "-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Helvetica Neue',sans-serif",
};

/* ══════════════════════════════════════════════════════════════════════
   CATEGORY METADATA — glowing color dots
   ══════════════════════════════════════════════════════════════════ */
const CAT_META = {
  Finance:       { color: "#34d399", glow: "rgba(52,211,153,0.55)" },
  "Sales & CRM": { color: "#60a5fa", glow: "rgba(96,165,250,0.55)" },
  Management:    { color: "#c084fc", glow: "rgba(192,132,252,0.55)" },
};

/* ══════════════════════════════════════════════════════════════════════
   NAV DATA  (unchanged)
   ══════════════════════════════════════════════════════════════════ */
const NAV = [{ name: "Home", path: "/", icon: HomeIcon }];

const BIZ_CATS = [
  {
    label: "Finance",
    items: [
      { name: "Expense Form",      path: "/expense-form",       icon: DocumentTextIcon },
      { name: "Food Bills",         path: "/foodbills",          icon: ReceiptPercentIcon },
      { name: "Overdues",           path: "/OverduesDashboard",  icon: CurrencyRupeeIcon },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { name: "Sales Report",        path: "/DailySalesReport",  icon: ChartBarIcon },
      { name: "CRM Activity",        path: "/Chemsalescrm",      icon: PlusCircleIcon },
      { name: "Purchase Order",      path: "/purchase",          icon: PlusCircleIcon },
      { name: "Price List Customer", path: "/pricelist",         icon: PlusCircleIcon },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Customer Lists", path: "/Customerlistpage",    icon: QueueListIcon },
      { name: "Stock List",     path: "/Stockmanager",        icon: CircleStackIcon },
      { name: "PDF Documents",  path: "/Pdfdocumentmanager",  icon: ClipboardDocumentListIcon },
      { name: "Notepad",        path: "/notepad",             icon: ClipboardDocumentListIcon },
      { name: "Copy Code",      path: "/copypaste",           icon: ClipboardDocumentListIcon },
      { name: "Mind Map Pro",   path: "/mindmap",             icon: ClipboardDocumentListIcon },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════
   ICON BUTTON
   ══════════════════════════════════════════════════════════════════ */
function IBtn({ children, onClick, title, size = 30 }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      aria-label={title}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: size, height: size,
        borderRadius: "8px",
        background: hov ? T.hover : "transparent",
        border: "none", cursor: "pointer",
        color: hov ? T.text : T.muted,
        transition: "background 0.18s, color 0.18s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   GRADIENT AVATAR RING
   ══════════════════════════════════════════════════════════════════ */
function AvatarRing({ user, size = 26 }) {
  const inner = size - 3;
  const fontSize = Math.round(size * 0.4);
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #7c3aed 0%, #818cf8 50%, #a78bfa 100%)",
      padding: "1.5px",
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 12px rgba(124,58,237,0.35)",
    }}>
      <div style={{
        width: inner, height: inner,
        borderRadius: "50%",
        background: "#18182a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize, fontWeight: "700", color: T.accent2,
        overflow: "hidden",
      }}>
        {user.profilePic ? (
          <img src={user.profilePic} alt={user.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          user.name?.charAt(0).toUpperCase()
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DROPDOWN ITEM — subtle left accent on hover
   ══════════════════════════════════════════════════════════════════ */
function DropItem({ item, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={item.path}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "7px 8px",
        borderRadius: "8px",
        textDecoration: "none",
        color: hov ? T.text : T.muted,
        background: hov ? T.itemHv : "transparent",
        fontSize: "13px",
        letterSpacing: "-0.018em",
        fontFamily: T.font,
        transition: "color 0.15s, background 0.15s, border-color 0.15s",
        borderLeft: `2px solid ${hov ? "rgba(167,139,250,0.60)" : "transparent"}`,
        paddingLeft: hov ? "7px" : "7px",
      }}
    >
      <item.icon style={{ width: "13px", height: "13px", flexShrink: 0, strokeWidth: 1.5 }} />
      {item.name}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [mobileCat,   setMobileCat]   = useState(null);
  const dropTimer = useRef(null);

  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  /* scroll border */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 2);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* close on route change */
  useEffect(() => {
    setMobileOpen(false);
    setMobileCat(null);
    setDropOpen(false);
  }, [location.pathname]);

  /* ESC key */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") { setDropOpen(false); setMobileOpen(false); }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive    = (p) => location.pathname === p;
  const handleLogout = () => { logout(); navigate("/login"); };
  const openDrop    = () => { clearTimeout(dropTimer.current); setDropOpen(true); };
  const closeDrop   = () => { dropTimer.current = setTimeout(() => setDropOpen(false), 90); };

  const base = {
    fontFamily: T.font,
    fontSize: "13px",
    fontWeight: "400",
    letterSpacing: "-0.022em",
    textDecoration: "none",
    transition: "color 0.18s, background 0.18s",
  };

  /* ── RENDER ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Global keyframes & utility classes ─────────────────────── */}
      <style>{`
        @keyframes appleSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes appleOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gradientShimmer {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }

        /* Animated gradient text — logo & drawer title */
        .nb-grad-text {
          background: linear-gradient(125deg, #c4b5fd 0%, #818cf8 40%, #7c3aed 70%, #a78bfa 100%);
          background-size: 250% 250%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShimmer 5s ease infinite;
        }

        /* Gradient CTA pill */
        .nb-pill {
          background: linear-gradient(135deg, #7c3aed 0%, #818cf8 100%);
          transition: opacity 0.18s, box-shadow 0.22s, transform 0.15s !important;
          box-shadow: 0 0 0 0 rgba(124,58,237,0);
        }
        .nb-pill:hover {
          opacity: 0.90 !important;
          box-shadow: 0 0 22px rgba(124,58,237,0.50) !important;
          transform: translateY(-1px) !important;
        }
        .nb-pill:active {
          transform: translateY(0) !important;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          NAV BAR
          ════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? T.navBgSolid : T.navBg,
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
          borderBottom: `0.5px solid ${scrolled ? T.borderMd : T.border}`,
          transition: "background 0.3s, border-color 0.3s",
          fontFamily: T.font,
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", height: "52px", gap: "16px" }}>

            {/* ── LOGO ──────────────────────────────────────────────── */}
            <Link to="/"
              style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}
            >
              {/* Gradient SVG droplet */}
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <defs>
                  <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"  stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <path d="M10 2C10 2 3 7.5 3 12a7 7 0 0014 0C17 7.5 10 2 10 2Z"
                  fill="url(#lg)" opacity=".95" />
                <path d="M10 6v8M7 11l3-3 3 3"
                  stroke="#fff" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="nb-grad-text"
                style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "-0.04em" }}>
                MyApp
              </span>
            </Link>

            {/* ── DESKTOP CENTER NAV ─────────────────────────────────── */}
            <div className="hidden md:flex"
              style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "1px" }}
            >
              {NAV.map((item) =>
                item.isHash ? (
                  <button key={item.name}
                    onClick={() => {
                      if (window.location.pathname !== "/") {
                        navigate("/");
                        setTimeout(() =>
                          document.querySelector(item.path.replace("/#", "#"))
                            ?.scrollIntoView({ behavior: "smooth" }), 100);
                      } else {
                        document.querySelector(item.path.replace("/#", "#"))
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    style={{
                      ...base,
                      padding: "5px 12px", borderRadius: "7px",
                      color: T.muted, border: "none", cursor: "pointer",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = T.text;
                      e.currentTarget.style.background = T.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = T.muted;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link key={item.name} to={item.path}
                    style={{
                      ...base,
                      padding: "5px 12px", borderRadius: "7px",
                      color: isActive(item.path) ? T.accent2 : T.muted,
                      background: isActive(item.path) ? T.accentT : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = T.text;
                      e.currentTarget.style.background = T.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color  = isActive(item.path) ? T.accent2 : T.muted;
                      e.currentTarget.style.background = isActive(item.path) ? T.accentT : "transparent";
                    }}
                  >
                    {item.name}
                  </Link>
                )
              )}

              {/* ── Business Tools dropdown ──────────────────────────── */}
              {user && (
                <div style={{ position: "relative" }}
                  onMouseEnter={openDrop}
                  onMouseLeave={closeDrop}
                >
                  <button
                    style={{
                      ...base,
                      display: "flex", alignItems: "center", gap: "3px",
                      padding: "5px 12px", borderRadius: "7px",
                      background: dropOpen ? T.accentT : "transparent",
                      color: dropOpen ? T.accent2 : T.muted,
                      border: "none", cursor: "pointer",
                    }}
                  >
                    Business Tools
                    <ChevronDownIcon style={{
                      width: "11px", height: "11px",
                      transform: dropOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.22s ease",
                    }} />
                  </button>

                  {/* ── MEGA DROPDOWN PANEL ─────────────────────────── */}
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: `translateX(-50%) translateY(${dropOpen ? "0" : "6px"})`,
                      background: T.dropBg,
                      backdropFilter: "saturate(180%) blur(28px)",
                      WebkitBackdropFilter: "saturate(180%) blur(28px)",
                      border: `0.5px solid ${T.borderMd}`,
                      borderRadius: "16px",
                      display: "flex", overflow: "hidden",
                      zIndex: 200,
                      opacity: dropOpen ? 1 : 0,
                      visibility: dropOpen ? "visible" : "hidden",
                      transition: "opacity 0.18s ease, visibility 0.18s, transform 0.18s ease",
                      pointerEvents: dropOpen ? "auto" : "none",
                      boxShadow: T.shadow,
                      minWidth: "520px",
                    }}
                  >
                    {BIZ_CATS.map((cat, i) => {
                      const meta = CAT_META[cat.label];
                      return (
                        <div key={cat.label}
                          style={{
                            flex: 1, padding: "16px 12px",
                            borderRight: i < BIZ_CATS.length - 1
                              ? `0.5px solid ${T.border}`
                              : "none",
                          }}
                        >
                          {/* Category label with glowing dot */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "0 6px", marginBottom: "6px",
                          }}>
                            <span style={{
                              width: "6px", height: "6px",
                              borderRadius: "50%",
                              background: meta.color,
                              boxShadow: `0 0 7px ${meta.glow}`,
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontSize: "10px", fontWeight: "700",
                              color: T.dim,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              fontFamily: T.font,
                            }}>
                              {cat.label}
                            </span>
                          </div>
                          {cat.items.map((item) => (
                            <DropItem key={item.name} item={item} />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── DESKTOP AUTH ──────────────────────────────────────── */}
            <div className="hidden md:flex"
              style={{ alignItems: "center", gap: "2px", flexShrink: 0 }}
            >
              {user ? (
                <>
                  {/* Avatar + name */}
                  <Link to="/"
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      textDecoration: "none",
                      padding: "4px 8px", borderRadius: "10px",
                      transition: "background 0.18s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <AvatarRing user={user} size={26} />
                    <span style={{ ...base, color: T.muted }} className="hidden lg:inline">
                      {user.name}
                    </span>
                  </Link>

                  {/* Sign out */}
                  <button
                    onClick={handleLogout}
                    style={{
                      ...base,
                      display: "flex", alignItems: "center", gap: "4px",
                      padding: "5px 10px", borderRadius: "7px",
                      background: "transparent", border: "none", cursor: "pointer",
                      color: T.muted,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = T.red;
                      e.currentTarget.style.background = T.redT;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = T.muted;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: "14px", height: "14px" }} />
                    <span className="hidden lg:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"
                    style={{ ...base, padding: "5px 10px", borderRadius: "7px", color: T.muted }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = T.text;
                      e.currentTarget.style.background = T.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = T.muted;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Sign in
                  </Link>
                  {/* Premium gradient pill CTA */}
                  <Link to="/register"
                    className="nb-pill"
                    style={{
                      ...base,
                      padding: "6px 18px",
                      borderRadius: "980px",
                      color: "#fff",
                      fontWeight: "600",
                      marginLeft: "4px",
                      display: "inline-block",
                    }}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* ── MOBILE HAMBURGER ──────────────────────────────────── */}
            <div className="md:hidden"
              style={{ display: "flex", alignItems: "center", flexShrink: 0, marginLeft: "auto" }}
            >
              <IBtn onClick={() => setMobileOpen(true)} title="Menu" size={32}>
                <Bars3Icon style={{ width: "18px", height: "18px" }} />
              </IBtn>
            </div>

          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          OVERLAY
          ════════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 110,
            background: T.overlay,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            animation: "appleOverlay 0.22s ease",
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          MOBILE SLIDE-IN DRAWER
          ════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 120,
          width: "min(300px, 86vw)",
          background: T.drawerBg,
          backdropFilter: "saturate(180%) blur(32px)",
          WebkitBackdropFilter: "saturate(180%) blur(32px)",
          borderLeft: `0.5px solid ${T.borderMd}`,
          display: "flex", flexDirection: "column",
          fontFamily: T.font,
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0,0.67,0)",
          willChange: "transform",
        }}
      >
        {/* ── Drawer header ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px 14px",
            borderBottom: `0.5px solid ${T.border}`,
            /* Subtle gradient wash at top of drawer */
            background: "linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)",
          }}
        >
          <span className="nb-grad-text"
            style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "-0.03em" }}>
            Menu
          </span>
          <IBtn onClick={() => setMobileOpen(false)} title="Close">
            <XMarkIcon style={{ width: "16px", height: "16px" }} />
          </IBtn>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {/* Static nav links */}
          {NAV.map((item) => (
            <Link key={item.name} to={item.path}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                textDecoration: "none",
                color: isActive(item.path) ? T.accent2 : T.text,
                background: isActive(item.path) ? T.accentT : "transparent",
                fontSize: "15px", fontWeight: "400",
                letterSpacing: "-0.022em",
                transition: "all 0.18s",
                fontFamily: T.font,
              }}
            >
              <item.icon style={{
                width: "16px", height: "16px",
                color: isActive(item.path) ? T.accent2 : T.muted,
                strokeWidth: 1.5,
              }} />
              {item.name}
            </Link>
          ))}

          {/* Business Tools section */}
          {user && (
            <>
              <div style={{ height: "0.5px", background: T.border, margin: "8px 4px" }} />
              <div style={{
                fontSize: "10px", fontWeight: "700",
                color: T.dim,
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "4px 12px 6px",
                fontFamily: T.font,
              }}>
                Business Tools
              </div>

              {BIZ_CATS.map((cat) => {
                const isOpen = mobileCat === cat.label;
                const meta   = CAT_META[cat.label];
                return (
                  <div key={cat.label}>
                    <button
                      onClick={() => setMobileCat(isOpen ? null : cat.label)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 12px", borderRadius: "10px",
                        background: isOpen ? T.hover : "transparent",
                        border: "none", cursor: "pointer",
                        color: T.text,
                        fontSize: "15px", fontWeight: "400",
                        letterSpacing: "-0.022em",
                        fontFamily: T.font,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          width: "8px", height: "8px",
                          borderRadius: "50%",
                          background: meta.color,
                          boxShadow: `0 0 8px ${meta.glow}`,
                          flexShrink: 0,
                        }} />
                        {cat.label}
                      </div>
                      <ChevronDownIcon style={{
                        width: "13px", height: "13px",
                        color: T.muted,
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }} />
                    </button>

                    {isOpen && (
                      <div style={{
                        marginLeft: "20px",
                        paddingLeft: "12px",
                        borderLeft: `0.5px solid ${T.border}`,
                        marginBottom: "4px",
                      }}>
                        {cat.items.map((item) => (
                          <DropItem
                            key={item.name}
                            item={item}
                            onClick={() => { setMobileOpen(false); setMobileCat(null); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Footer — auth ─────────────────────────────────────────── */}
        <div style={{ padding: "12px 14px", borderTop: `0.5px solid ${T.border}` }}>
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* User card */}
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "12px",
                border: `0.5px solid ${T.borderMd}`,
                background: "rgba(124,58,237,0.06)",
              }}>
                <AvatarRing user={user} size={34} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: T.text, letterSpacing: "-0.022em" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "11px", color: T.muted, letterSpacing: "-0.01em" }}>
                    Signed in
                  </div>
                </div>
              </div>
              {/* Sign out */}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  width: "100%", padding: "10px 12px",
                  borderRadius: "10px",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: T.red,
                  fontSize: "14px", letterSpacing: "-0.022em",
                  fontFamily: T.font, fontWeight: "400",
                  transition: "background 0.18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.redT)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ArrowRightOnRectangleIcon style={{ width: "15px", height: "15px" }} />
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <Link to="/login" onClick={() => setMobileOpen(false)}
                style={{
                  display: "block", textAlign: "center",
                  padding: "11px", borderRadius: "12px",
                  textDecoration: "none",
                  color: T.accent2,
                  fontSize: "15px", fontWeight: "500",
                  border: `0.5px solid rgba(124,58,237,0.28)`,
                  background: T.accentT,
                  letterSpacing: "-0.022em",
                  fontFamily: T.font,
                  transition: "background 0.18s",
                }}
              >
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="nb-pill"
                style={{
                  display: "block", textAlign: "center",
                  padding: "11px", borderRadius: "12px",
                  textDecoration: "none",
                  color: "#fff",
                  fontSize: "15px", fontWeight: "600",
                  letterSpacing: "-0.022em",
                  fontFamily: T.font,
                }}
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}