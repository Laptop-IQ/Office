import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  ListBulletIcon,
  CubeIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/context/AuthContext";

/* ══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════════════════════════ */

const T = {
  navBg: "rgba(8, 8, 12, 0.72)",
  navBgSolid: "rgba(11, 11, 16, 0.97)",
  drawerBg: "rgba(11, 11, 16, 0.99)",

  border: "rgba(255, 255, 255, 0.07)",
  borderMd: "rgba(255, 255, 255, 0.11)",

  text: "#f2f2f7",
  muted: "#8e8e93",
  dim: "#55555d",

  hover: "rgba(255, 255, 255, 0.055)",
  activeBg: "rgba(124, 58, 237, 0.13)",
  accent: "#a78bfa",

  red: "#ff453a",
  redBg: "rgba(255, 69, 58, 0.10)",

  overlay: "rgba(0, 0, 0, 0.72)",

  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif",
};

/* ══════════════════════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════════════════════ */

const NAV = [
  {
    section: "MAIN",
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
    section: "INVENTORY",
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
    ],
  },

  {
    section: "REPORTS",
    items: [
      {
        name: "Overdue Payments",
        path: "/OverduesDashboard",
        icon: CreditCardIcon,
        badge: "Alert",
      },
      {
        name: "Daily Visit Report",
        path: "/DailySalesReport",
        icon: ChartBarIcon,
      },
    ],
  },
];

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

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

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
  }, [location.pathname]);

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
        className="app-navbar"
        aria-label="Main navigation"
        data-scrolled={scrolled}
      >
        <div className="app-navbar-inner">
          {/* INTENTIONALLY EMPTY */}

          <div className="app-desktop-menu" aria-hidden="true" />

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
              <div className="app-mobile-section-title">ACCOUNT</div>

              <AccountItem user={user} onLogout={handleLogout} />
            </section>
          </div>
        </aside>
      )}
    </>
  );
}

export default Navbar;
