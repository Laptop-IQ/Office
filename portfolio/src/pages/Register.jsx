// pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const getPasswordStrength = (password) => {
  if (!password) return { label: "", color: "", width: "0%" };
  if (password.length < 6)
    return { label: "Weak", color: "bg-red-400", width: "25%" };
  if (password.length < 8)
    return { label: "Fair", color: "bg-yellow-400", width: "50%" };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 2)
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  return { label: "Good", color: "bg-blue-400", width: "75%" };
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    if (result?.success) {
      navigate("/verify-otp", { state: { email: formData.email } });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white opacity-5"></div>
          <div className="absolute bottom-10 left-0 w-64 h-64 rounded-full bg-indigo-400 opacity-10"></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-blue-300 opacity-10"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md"></div>
          </div>
          <span className="text-white font-bold text-xl">MyApp</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Start managing
            <br />
            smarter today
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Join your team and get instant access to all business tools and
            reports.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Reports", desc: "Real-time insights" },
              { label: "Expenses", desc: "Track every rupee" },
              { label: "Sales", desc: "Daily summaries" },
              { label: "Bills", desc: "Quick generation" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm"
              >
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-blue-200 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white border-opacity-20 pt-6">
          <p className="text-blue-200 text-sm">
            Already on the team?{" "}
            <Link
              to="/login"
              className="text-white font-semibold hover:underline"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"></div>
            <span className="font-bold text-xl text-gray-900">MyApp</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Strength bar */}
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      strength.label === "Weak"
                        ? "text-red-500"
                        : strength.label === "Fair"
                          ? "text-yellow-500"
                          : strength.label === "Good"
                            ? "text-blue-500"
                            : "text-green-600"
                    }`}
                  >
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords don't match
                  </p>
                )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
