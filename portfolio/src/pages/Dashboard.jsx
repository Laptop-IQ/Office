// pages/Dashboard.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  DocumentTextIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const businessTools = [
  {
    name: "Expense Form",
    description: "Submit and track business expenses",
    path: "/expense-form",
    icon: DocumentTextIcon,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Food Bills",
    description: "Generate thermal food bill receipts",
    path: "/foodbills",
    icon: ReceiptPercentIcon,
    color: "from-green-500 to-green-600",
  },
  {
    name: "Trial Report",
    description: "Manage and view trial reports",
    path: "/TrialReportSystem",
    icon: ChartBarIcon,
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Daily Sales Report",
    description: "Track daily sales performance",
    path: "/DailySalesReport",
    icon: ChartBarIcon,
    color: "from-orange-500 to-orange-600",
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg" />
            <span className="font-bold text-xl text-gray-900">MyApp</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <UserCircleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors text-sm font-medium"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-blue-100 text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Business Tools Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Business Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businessTools.map((tool) => (
              <Link
                key={tool.name}
                to={tool.path}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-100 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}
                >
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {tool.description}
                  </p>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Account Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Account</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <UserCircleIcon className="w-4 h-4" />
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
