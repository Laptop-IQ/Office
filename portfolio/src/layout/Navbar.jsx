// layout/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "@heroicons/react/24/outline";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation items
  const navItems = [{ name: "Home", path: "/", icon: HomeIcon }];

  // Business items grouped by category
  const businessCategories = [
    {
      label: "Finance",
      items: [
        { name: "Expense Form", path: "/expense-form", icon: DocumentTextIcon },
        { name: "Food Bills", path: "/foodbills", icon: ReceiptPercentIcon },
        {
          name: "Overdues",
          path: "/OverduesDashboard",
          icon: CurrencyRupeeIcon,
        },
      ],
    },
    {
      label: "Sales & CRM",
      items: [
        { name: "Sales Report", path: "/DailySalesReport", icon: ChartBarIcon },
        { name: "CRM Activity", path: "/Chemsalescrm", icon: PlusCircleIcon },
        { name: "Purchase Order", path: "/purchase", icon: PlusCircleIcon },
        {
          name: "Price list Customer",
          path: "/pricelist",
          icon: PlusCircleIcon,
        },
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
        {
          name: "Notepad",
          path: "/notepad",
          icon: ClipboardDocumentListIcon,
        },
        {
          name: "Copy Code",
          path: "/copypaste",
          icon: ClipboardDocumentListIcon,
        },
      ],
    },
  ];

  const handleHashLink = (path) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.querySelector(path.replace("/#", "#"));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.querySelector(path.replace("/#", "#"));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"></div>
              <span className="font-bold text-xl text-gray-900">MyApp</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <React.Fragment key={item.name}>
                {item.isHash ? (
                  <button
                    onClick={() => handleHashLink(item.path)}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </React.Fragment>
            ))}

            {/* Business Dropdown — categorized */}
            {user && (
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center">
                  Business Tools
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Multi-column dropdown */}
                <div className="absolute left-0 mt-2 w-auto min-w-max bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                  <div className="flex divide-x divide-gray-100">
                    {businessCategories.map((category) => (
                      <div
                        key={category.label}
                        className="py-3 px-4 min-w-[160px]"
                      >
                        {/* Category heading */}
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                          {category.label}
                        </p>
                        {category.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-md"
                          >
                            <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden lg:inline">
                    {user.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <React.Fragment key={item.name}>
                {item.isHash ? (
                  <button
                    onClick={() => handleHashLink(item.path)}
                    className="block w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    {item.name}
                  </Link>
                )}
              </React.Fragment>
            ))}

            {/* Mobile — Categorized Business Tools */}
            {user && (
              <>
                <div className="border-t border-gray-200 my-2"></div>

                {businessCategories.map((category) => (
                  <div key={category.label}>
                    {/* Toggle category on mobile */}
                    <button
                      onClick={() =>
                        setActiveCategory(
                          activeCategory === category.label
                            ? null
                            : category.label,
                        )
                      }
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      <span>{category.label}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeCategory === category.label ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {activeCategory === category.label && (
                      <div className="ml-2 border-l border-gray-100 pl-2">
                        {category.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setActiveCategory(null);
                            }}
                            className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                          >
                            <item.icon className="w-5 h-5 mr-2" />
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            <div className="border-t border-gray-200 my-2"></div>

            {user ? (
              <>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-base font-medium text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
