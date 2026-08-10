// layout/Navbar.jsx
// Apple Liquid Glass · Mobile Drawer

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

/* ─── Design tokens (light) ─────────────────────────────────────────── */
const T = {
  navBg: "rgba(255,255,255,0.72)",
  navBgSolid: "rgba(251,251,253,0.96)",
  dropBg: "rgba(251,251,253,0.98)",
  border: "rgba(0,0,0,0.08)",
  borderMd: "rgba(0,0,0,0.13)",
  text: "#1d1d1f",
  muted: "#6e6e73",
  dim: "#aeaeb2",
  hover: "rgba(0,0,0,0.04)",
  itemHv: "rgba(0,0,0,0.05)",
  accent: "#0071e3",
  accentT: "rgba(0,113,227,0.10)",
  red: "#ff3b30",
  redT: "rgba(255,59,48,0.08)",
  shadow: "0 8px 40px rgba(0,0,0,0.10)",
  overlay: "rgba(0,0,0,0.40)",
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Helvetica Neue',sans-serif",
};

/* ─── Category dot colors ───────────────────────────────────────────── */
const CAT_META = {
  Finance: "#30d158",
  "Sales & CRM": "#0071e3",
  Management: "#bf5af2",
};

/* ─── Nav data ──────────────────────────────────────────────────────── */
const NAV = [{ name: "Home", path: "/", icon: HomeIcon }];

const BIZ_CATS = [
  {
    label: "Finance",
    items: [
      { name: "Expense Form", path: "/expense-form", icon: DocumentTextIcon },
      { name: "Food Bills", path: "/foodbills", icon: ReceiptPercentIcon },
      { name: "Overdues", path: "/OverduesDashboard", icon: CurrencyRupeeIcon },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { name: "Sales Report", path: "/DailySalesReport", icon: ChartBarIcon },
      { name: "CRM Activity", path: "/Chemsalescrm", icon: PlusCircleIcon },
      { name: "Purchase Order", path: "/purchase", icon: PlusCircleIcon },
      { name: "Price List Customer", path: "/pricelist", icon: PlusCircleIcon },
    ],
  },
  {
    label: "Management",
    items: [
      {
        name: "Customer Lists",
        path: "/Customerlistpage",
        icon: QueueListIcon,
      },
      { name: "Stock List", path: "/Stockmanager", icon: CircleStackIcon },
      {
        name: "PDF Documents",
        path: "/Pdfdocumentmanager",
        icon: ClipboardDocumentListIcon,
      },
      { name: "Notepad", path: "/notepad", icon: ClipboardDocumentListIcon },
      {
        name: "Copy Code",
        path: "/copypaste",
        icon: ClipboardDocumentListIcon,
      },
      {
        name: "Mind Map Pro",
        path: "/mindmap",
        icon: ClipboardDocumentListIcon,
      },
    ],
  },
];

/* ─── Icon button ───────────────────────────────────────────────────── */
function IBtn({ children, onClick, title, size = 30 }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      aria-label={title}
      title={title}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "8px",
        background: hov ? T.hover : "transparent",
        border: "none",
        cursor: "pointer",
        color: T.muted,
        transition: "background 0.18s, color 0.18s",
        flexShrink: 0,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

/* ─── Dropdown item ─────────────────────────────────────────────────── */
function DropItem({ item, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={item.path}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "6px 7px",
        borderRadius: "7px",
        textDecoration: "none",
        color: hov ? T.text : T.muted,
        background: hov ? T.itemHv : "transparent",
        fontSize: "13px",
        letterSpacing: "-0.018em",
        fontFamily: T.font,
        transition: "color 0.15s, background 0.15s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <item.icon
        style={{
          width: "13px",
          height: "13px",
          flexShrink: 0,
          strokeWidth: 1.5,
        }}
      />
      {item.name}
    </Link>
  );
}

/* ─── Main component ────────────────────────────────────────────────── */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState(null);

  const dropTimer = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      if (e.key === "Escape") {
        setDropOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  /* lock body scroll on mobile drawer */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (p) => location.pathname === p;
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* dropdown hover with delay gap */
  const openDrop = () => {
    clearTimeout(dropTimer.current);
    setDropOpen(true);
  };
  const closeDrop = () => {
    dropTimer.current = setTimeout(() => setDropOpen(false), 90);
  };

  /* shared text-link base style */
  const base = {
    fontFamily: T.font,
    fontSize: "13px",
    fontWeight: "400",
    letterSpacing: "-0.022em",
    textDecoration: "none",
    transition: "color 0.18s, background 0.18s",
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes appleSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes appleOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? T.navBgSolid : T.navBg,
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: `0.5px solid ${scrolled ? T.border : "transparent"}`,
          transition: "background 0.3s, border-color 0.3s",
          fontFamily: T.font,
        }}
      >
        <div
          style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "52px",
              gap: "16px",
            }}
          >
            {/* ── Logo ──────────────────────────────────────────────── */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2C10 2 3 7.5 3 12a7 7 0 0014 0C17 7.5 10 2 10 2Z"
                  fill={T.accent}
                  opacity=".9"
                />
                <path
                  d="M10 6v8M7 11l3-3 3 3"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  color: T.text,
                  fontSize: "17px",
                  fontWeight: "600",
                  letterSpacing: "-0.03em",
                }}
              >
                MyApp
              </span>
            </Link>

            {/* ── Desktop center nav ────────────────────────────────── */}
            <div
              className="hidden md:flex"
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: "1px",
              }}
            >
              {NAV.map((item) =>
                item.isHash ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (window.location.pathname !== "/") {
                        navigate("/");
                        setTimeout(
                          () =>
                            document
                              .querySelector(item.path.replace("/#", "#"))
                              ?.scrollIntoView({ behavior: "smooth" }),
                          100,
                        );
                      } else {
                        document
                          .querySelector(item.path.replace("/#", "#"))
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    style={{
                      ...base,
                      padding: "5px 12px",
                      borderRadius: "6px",
                      color: T.muted,
                      border: "none",
                      cursor: "pointer",
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
                  <Link
                    key={item.name}
                    to={item.path}
                    style={{
                      ...base,
                      padding: "5px 12px",
                      borderRadius: "6px",
                      color: isActive(item.path) ? T.accent : T.muted,
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = T.text;
                      e.currentTarget.style.background = T.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isActive(item.path)
                        ? T.accent
                        : T.muted;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.name}
                  </Link>
                ),
              )}

              {/* Business Tools dropdown */}
              {user && (
                <div
                  style={{ position: "relative" }}
                  onMouseEnter={openDrop}
                  onMouseLeave={closeDrop}
                >
                  <button
                    style={{
                      ...base,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: dropOpen ? T.hover : "transparent",
                      color: dropOpen ? T.text : T.muted,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Business Tools
                    <ChevronDownIcon
                      style={{
                        width: "11px",
                        height: "11px",
                        transform: dropOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {/* ── Mega dropdown panel ──────────────────────── */}
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: "50%",
                      transform: `translateX(-50%) translateY(${dropOpen ? "0" : "5px"})`,
                      background: T.dropBg,
                      backdropFilter: "saturate(180%) blur(24px)",
                      WebkitBackdropFilter: "saturate(180%) blur(24px)",
                      border: `0.5px solid ${T.border}`,
                      borderRadius: "14px",
                      display: "flex",
                      overflow: "hidden",
                      zIndex: 200,
                      opacity: dropOpen ? 1 : 0,
                      visibility: dropOpen ? "visible" : "hidden",
                      transition:
                        "opacity 0.16s ease, visibility 0.16s, transform 0.16s ease",
                      pointerEvents: dropOpen ? "auto" : "none",
                      boxShadow: T.shadow,
                      minWidth: "510px",
                    }}
                  >
                    {BIZ_CATS.map((cat, i) => (
                      <div
                        key={cat.label}
                        style={{
                          flex: 1,
                          padding: "14px 12px",
                          borderRight:
                            i < BIZ_CATS.length - 1
                              ? `0.5px solid ${T.border}`
                              : "none",
                        }}
                      >
                        {/* Category label */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "0 5px",
                            marginBottom: "5px",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: CAT_META[cat.label],
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: "600",
                              color: T.dim,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              fontFamily: T.font,
                            }}
                          >
                            {cat.label}
                          </span>
                        </div>
                        {/* Links */}
                        {cat.items.map((item) => (
                          <DropItem key={item.name} item={item} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Desktop auth ──────────────────────────────────────── */}
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "2px",
                flexShrink: 0,
              }}
            >
              {user ? (
                <>
                  {/* Avatar + name */}
                  <Link
                    to="/"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      padding: "4px 8px",
                      borderRadius: "9px",
                      transition: "background 0.18s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.hover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: T.accentT,
                        border: `0.5px solid ${T.accent}55`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "600",
                        color: T.accent,
                        overflow: "hidden",
                      }}
                    >
                      {user.profilePic ? (
                        <img
                          src={user.profilePic}
                          alt={user.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span
                      style={{ ...base, color: T.muted }}
                      className="hidden lg:inline"
                    >
                      {user.name}
                    </span>
                  </Link>

                  {/* Sign out */}
                  <button
                    onClick={handleLogout}
                    style={{
                      ...base,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
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
                    <ArrowRightOnRectangleIcon
                      style={{ width: "14px", height: "14px" }}
                    />
                    <span className="hidden lg:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    style={{
                      ...base,
                      padding: "5px 10px",
                      borderRadius: "7px",
                      color: T.muted,
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
                    Sign in
                  </Link>
                  {/* Apple pill CTA */}
                  <Link
                    to="/register"
                    style={{
                      ...base,
                      padding: "6px 16px",
                      borderRadius: "980px",
                      background: T.accent,
                      color: "#fff",
                      fontWeight: "500",
                      transition: "opacity 0.18s",
                      marginLeft: "4px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.84")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile hamburger ──────────────────────────────────── */}
            <div
              className="md:hidden"
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <IBtn onClick={() => setMobileOpen(true)} title="Menu" size={32}>
                <Bars3Icon style={{ width: "18px", height: "18px" }} />
              </IBtn>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: T.overlay,
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            animation: "appleOverlay 0.22s ease",
          }}
        />
      )}

      {/* ── Mobile slide-in drawer ─────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 120,
          width: "min(300px, 86vw)",
          background: T.dropBg,
          backdropFilter: "saturate(180%) blur(28px)",
          WebkitBackdropFilter: "saturate(180%) blur(28px)",
          borderLeft: `0.5px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          fontFamily: T.font,
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0,0.67,0)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 14px",
            borderBottom: `0.5px solid ${T.border}`,
          }}
        >
          <span
            style={{
              fontSize: "17px",
              fontWeight: "600",
              color: T.text,
              letterSpacing: "-0.03em",
            }}
          >
            Menu
          </span>
          <IBtn onClick={() => setMobileOpen(false)} title="Close">
            <XMarkIcon style={{ width: "16px", height: "16px" }} />
          </IBtn>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {/* Static nav links */}
          {NAV.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                textDecoration: "none",
                color: isActive(item.path) ? T.accent : T.text,
                background: isActive(item.path) ? T.accentT : "transparent",
                fontSize: "15px",
                fontWeight: "400",
                letterSpacing: "-0.022em",
                transition: "all 0.18s",
                fontFamily: T.font,
              }}
            >
              <item.icon
                style={{
                  width: "16px",
                  height: "16px",
                  color: isActive(item.path) ? T.accent : T.muted,
                  strokeWidth: 1.5,
                }}
              />
              {item.name}
            </Link>
          ))}

          {/* Business categories */}
          {user && (
            <>
              <div
                style={{
                  height: "0.5px",
                  background: T.border,
                  margin: "8px 4px",
                }}
              />
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: T.dim,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "4px 12px 6px",
                  fontFamily: T.font,
                }}
              >
                Business Tools
              </div>

              {BIZ_CATS.map((cat) => {
                const isOpen = mobileCat === cat.label;
                return (
                  <div key={cat.label}>
                    <button
                      onClick={() => setMobileCat(isOpen ? null : cat.label)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: isOpen ? T.hover : "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: T.text,
                        fontSize: "15px",
                        fontWeight: "400",
                        letterSpacing: "-0.022em",
                        fontFamily: T.font,
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: CAT_META[cat.label],
                            flexShrink: 0,
                          }}
                        />
                        {cat.label}
                      </div>
                      <ChevronDownIcon
                        style={{
                          width: "13px",
                          height: "13px",
                          color: T.muted,
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          marginLeft: "20px",
                          paddingLeft: "12px",
                          borderLeft: `0.5px solid ${T.border}`,
                          marginBottom: "4px",
                        }}
                      >
                        {cat.items.map((item) => (
                          <DropItem
                            key={item.name}
                            item={item}
                            onClick={() => {
                              setMobileOpen(false);
                              setMobileCat(null);
                            }}
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

        {/* Footer — auth */}
        <div
          style={{ padding: "12px 14px", borderTop: `0.5px solid ${T.border}` }}
        >
          {user ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {/* User card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `0.5px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: T.accentT,
                    border: `0.5px solid ${T.accent}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: T.accent,
                    overflow: "hidden",
                  }}
                >
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: T.text,
                      letterSpacing: "-0.022em",
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: T.muted,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Signed in
                  </div>
                </div>
              </div>
              {/* Sign out */}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: T.red,
                  fontSize: "14px",
                  letterSpacing: "-0.022em",
                  fontFamily: T.font,
                  fontWeight: "400",
                  transition: "background 0.18s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.redT)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <ArrowRightOnRectangleIcon
                  style={{ width: "15px", height: "15px" }}
                />
                Sign out
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "7px" }}
            >
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "11px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: T.accent,
                  fontSize: "15px",
                  fontWeight: "500",
                  border: `0.5px solid ${T.accent}55`,
                  background: T.accentT,
                  letterSpacing: "-0.022em",
                  fontFamily: T.font,
                }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "11px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "500",
                  background: T.accent,
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
