// pages/Register.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const getPasswordStrength = (password) => {
  if (!password) {
    return {
      label: "",
      color: "",
      width: "0%",
    };
  }

  if (password.length < 6) {
    return {
      label: "Weak",
      color: "bg-red-500",
      width: "25%",
    };
  }

  if (password.length < 8) {
    return {
      label: "Fair",
      color: "bg-yellow-500",
      width: "50%",
    };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (score >= 2) {
    return {
      label: "Strong",
      color: "bg-emerald-500",
      width: "100%",
    };
  }

  return {
    label: "Good",
    color: "bg-blue-500",
    width: "75%",
  };
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
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (result?.success) {
        navigate("/verify-otp", {
          state: {
            email: formData.email,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
       
        {/* Card */}
        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.04]
            p-6
            sm:p-8
            shadow-2xl
            shadow-black/20
          "
        >
          {/* Heading */}
          <div className="text-center mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Get started with your business workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Full name
              </label>

              <div className="relative">
                <UserIcon
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    h-5
                    w-5
                    text-slate-500
                    pointer-events-none
                  "
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="
                    w-full
                    h-12
                    rounded-xl
                    border
                    border-white/10
                    bg-slate-900/70
                    pl-11
                    pr-4
                    text-sm
                    text-white
                    placeholder:text-slate-600
                    outline-none
                    transition
                    focus:border-violet-500
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <div className="relative">
                <EnvelopeIcon
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    h-5
                    w-5
                    text-slate-500
                    pointer-events-none
                  "
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="
                    w-full
                    h-12
                    rounded-xl
                    border
                    border-white/10
                    bg-slate-900/70
                    pl-11
                    pr-4
                    text-sm
                    text-white
                    placeholder:text-slate-600
                    outline-none
                    transition
                    focus:border-violet-500
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <LockClosedIcon
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    h-5
                    w-5
                    text-slate-500
                    pointer-events-none
                  "
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="
                    w-full
                    h-12
                    rounded-xl
                    border
                    border-white/10
                    bg-slate-900/70
                    pl-11
                    pr-12
                    text-sm
                    text-white
                    placeholder:text-slate-600
                    outline-none
                    transition
                    focus:border-violet-500
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    w-9
                    h-9
                    flex
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    hover:text-slate-200
                    hover:bg-white/5
                    transition
                  "
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password strength */}
              {formData.password && (
                <div className="mt-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-500">
                      Password strength
                    </span>

                    <span
                      className={`text-[11px] font-medium ${
                        strength.label === "Weak"
                          ? "text-red-400"
                          : strength.label === "Fair"
                            ? "text-yellow-400"
                            : strength.label === "Good"
                              ? "text-blue-400"
                              : "text-emerald-400"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>

                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockClosedIcon
                  className={`
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    h-5
                    w-5
                    pointer-events-none
                    ${passwordsMatch ? "text-emerald-500" : "text-slate-500"}
                  `}
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`
                    w-full
                    h-12
                    rounded-xl
                    border
                    bg-slate-900/70
                    pl-11
                    pr-12
                    text-sm
                    text-white
                    placeholder:text-slate-600
                    outline-none
                    transition
                    focus:ring-4
                    ${
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                        : passwordsMatch
                          ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/10"
                          : "border-white/10 focus:border-violet-500 focus:ring-violet-500/10"
                    }
                  `}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    w-9
                    h-9
                    flex
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    hover:text-slate-200
                    hover:bg-white/5
                    transition
                  "
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {formData.confirmPassword && (
                <p
                  className={`mt-1.5 text-[11px] ${
                    passwordsMatch ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="pt-1 text-[11px] leading-5 text-slate-500">
              By creating an account, you agree to our{" "}
              <span className="text-slate-300 hover:text-white cursor-pointer">
                Terms
              </span>{" "}
              and{" "}
              <span className="text-slate-300 hover:text-white cursor-pointer">
                Privacy Policy
              </span>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-12
                rounded-xl
                bg-violet-600
                hover:bg-violet-500
                active:bg-violet-700
                text-sm
                font-semibold
                shadow-lg
                shadow-violet-600/20
                transition-all
                flex
                items-center
                justify-center
                gap-2
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <>
                  <span
                    className="
                      w-4
                      h-4
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                      animate-spin
                    "
                  />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="mt-7 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?
              <Link
                to="/login"
                className="
                  ml-1.5
                  font-semibold
                  text-violet-400
                  hover:text-violet-300
                  transition
                "
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600">
          <ShieldCheckIcon className="w-4 h-4" />
          Secure authentication
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[11px] text-slate-700">
          © {new Date().getFullYear()} MyApp. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default Register;
