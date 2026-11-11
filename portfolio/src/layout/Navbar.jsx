import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  ListBulletIcon,
  CubeIcon,
  TruckIcon,
  CreditCardIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/context/AuthContext";

/* ══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════════════════════ */

const NAV = [
  {
    section: "Main",
    items: [
      {
        name: "Dashboard",
        path: "/",
        icon: HomeIcon,
      },
      {
        name: "Purchase",
        path: "/purchase",
        icon: ShoppingCartIcon,
      },
    ],
  },

  {
    section: "Inventory",
    items: [
      {
        name: "Price List",
        path: "/pricelist",
        icon: ListBulletIcon,
      },
      {
        name: "Stock Manager",
        path: "/Stockmanager",
        icon: CubeIcon,
      },
      {
        name: "Dispatch",
        path: "/Dispatch",
        icon: TruckIcon,
      },
    ],
  },

  {
    section: "Reports",
    items: [
      {
        name: "Overdue Payments",
        path: "/OverduesDashboard",
        icon: CreditCardIcon,
      },
      {
        name: "Daily Visit Report",
        path: "/DailySalesReport",
        icon: ChartBarIcon,
      },
      {
        name: "Ecofast Trial Reports",
        path: "/Ecofast",
        icon: DocumentTextIcon,
      },
    ],
  },
];

// Short labels for the inline (desktop) menu
const SHORT_LABEL = {
  "/": "Home",
  "/purchase": "Purchase",
  "/pricelist": "Price List",
  "/Stockmanager": "Stock",
  "/Dispatch": "Dispatch",
  "/OverduesDashboard": "Overdues",
  "/DailySalesReport": "Visits",
  "/Ecofast": "Ecofast",
};
const ALL_LINKS = NAV.flatMap((g) => g.items);

/* ══════════════════════════════════════════════════════════════════════
   NAV ITEM
   ══════════════════════════════════════════════════════════════════════ */

function NavItem({ item, active, mobile = false, onClick }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`app-nav-item ${active ? "active" : ""} ${
        mobile ? "mobile-item" : ""
      }`}
    >
      <Icon className="app-nav-icon" aria-hidden="true" />

      <span className="app-nav-label">{item.name}</span>

      {item.badge && <span className="app-nav-badge">{item.badge}</span>}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ACCOUNT ITEM
   ══════════════════════════════════════════════════════════════════════ */

function AccountItem({ user, onLogout }) {
  const displayName = user?.name || user?.email || "User";

  return (
    <div className="app-account-section">
      {/* USER */}

      {user ? (
        <>
          <div className="app-user-card">
            <div className="app-user-avatar">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="" loading="lazy" />
              ) : (
                <UserCircleIcon aria-hidden="true" />
              )}
            </div>

            <div className="app-user-info">
              <div className="app-user-name">{displayName}</div>

              {user?.email && user?.name && (
                <div className="app-user-email">{user.email}</div>
              )}

              <div className="app-user-status">
                <span className="app-status-dot" />
                Signed in
              </div>
            </div>
          </div>

          {/* LOGOUT */}

          <button
            type="button"
            className="app-logout-button"
            onClick={onLogout}
          >
            <ArrowRightOnRectangleIcon aria-hidden="true" />

            <span>Logout</span>
          </button>
        </>
      ) : (
        /* LOGIN */

        <Link to="/login" className="app-login-item">
          <ArrowRightOnRectangleIcon aria-hidden="true" />

          <span>Login</span>
        </Link>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════════════════════════════════════ */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout, token } = useAuth();

  /* ══════════════════════════════════════════════════════════════════
     ACTIVE ROUTE
     ════════════════════════════════════════════════════════════════ */

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     SCROLL
     ════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ══════════════════════════════════════════════════════════════════
     ROUTE CHANGE
     ════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    setMobileOpen(false);
    setAcctOpen(false);
  }, [location.pathname]);

  /* Account menu: close on outside click / Escape */
  useEffect(() => {
    if (!acctOpen) return undefined;
    const onDown = (e) => {
      if (acctRef.current && !acctRef.current.contains(e.target)) setAcctOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setAcctOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [acctOpen]);

  /* ══════════════════════════════════════════════════════════════════
     ESC KEY
     ════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  /* ══════════════════════════════════════════════════════════════════
     BODY SCROLL LOCK
     ════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  /* ══════════════════════════════════════════════════════════════════
     LOGOUT
     ════════════════════════════════════════════════════════════════ */

  const handleLogout = async () => {
    try {
      setMobileOpen(false);

      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          NAVBAR
          ════════════════════════════════════════════════════════════ */}

      <nav
        className={`app-navbar${token ? " app-navbar--inline" : ""}`}
        aria-label="Main navigation"
        data-scrolled={scrolled}
      >
        <div className="app-navbar-inner">
          <Link to="/" className="app-brand">
            <span className="app-brand-mark" aria-hidden="true" />
            My Office Workplace
          </Link>

          {token && (
            <div className="app-desktop-menu">
              {ALL_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`app-top-link${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={item.name}
                  >
                    <Icon aria-hidden="true" />
                    <span>{SHORT_LABEL[item.path] || item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {token && (
            <div className="app-top-account" ref={acctRef}>
              <button
                type="button"
                className="app-top-avatar"
                aria-haspopup="menu"
                aria-expanded={acctOpen}
                aria-label="Account menu"
                title={user?.name || user?.email || "Account"}
                onClick={() => setAcctOpen((o) => !o)}
              >
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="" />
                ) : (
                  (user?.name || user?.email || "U").charAt(0).toUpperCase()
                )}
              </button>
              {acctOpen && (
                <div className="app-top-pop" role="menu">
                  <div className="who">
                    <div className="n">{user?.name || user?.email || "User"}</div>
                    {user?.name && user?.email && <div className="e">{user.email}</div>}
                  </div>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <ArrowRightOnRectangleIcon aria-hidden="true" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MENU */}

          <button
            type="button"
            className="app-menu-button"
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="app-mobile-drawer"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <XMarkIcon aria-hidden="true" />
            ) : (
              <Bars3Icon aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          OVERLAY
          ════════════════════════════════════════════════════════════ */}

      {mobileOpen && (
        <div
          className="app-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          DRAWER
          ════════════════════════════════════════════════════════════ */}

      {mobileOpen && (
        <aside
          id="app-mobile-drawer"
          className="app-mobile-drawer"
          aria-label="Navigation menu"
        >
          {/* HEADER */}

          <div className="app-drawer-header">
            <div className="app-drawer-title">Menu</div>

            <button
              type="button"
              className="app-drawer-close"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            >
              <XMarkIcon aria-hidden="true" />
            </button>
          </div>

          {/* NAVIGATION */}

          <div className="app-drawer-content">
            {NAV.map((group) => (
              <section className="app-mobile-group" key={group.section}>
                <div className="app-mobile-section-title">{group.section}</div>

                <div>
                  {group.items.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      active={isActive(item.path)}
                      mobile
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* ACCOUNT */}

            <section className="app-mobile-group">
              <div className="app-mobile-section-title">Account</div>

              <AccountItem user={user} onLogout={handleLogout} />
            </section>
          </div>
        </aside>
      )}
    </>
  );
}

export default Navbar;
