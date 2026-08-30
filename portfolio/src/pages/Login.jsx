import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const result = await login(email, password, remember);

      if (result?.success) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 shadow-2xl shadow-black/20">
          {/* Heading */}
          <div className="mb-7 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="
                    w-full h-12
                    rounded-xl
                    border border-white/10
                    bg-slate-900/70
                    pl-11 pr-4
                    text-sm text-white
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
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-violet-400 hover:text-violet-300 transition"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="
                    w-full h-12
                    rounded-xl
                    border border-white/10
                    bg-slate-900/70
                    pl-11 pr-12
                    text-sm text-white
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
                    absolute right-3 top-1/2 -translate-y-1/2
                    w-9 h-9
                    flex items-center justify-center
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
            </div>

            {/* Remember */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="
                  h-4 w-4
                  rounded
                  border-slate-700
                  bg-slate-900
                  text-violet-600
                  focus:ring-violet-500
                "
              />

              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition">
                Keep me signed in
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full h-12
                rounded-xl
                bg-violet-600
                hover:bg-violet-500
                active:bg-violet-700
                text-sm font-semibold
                shadow-lg shadow-violet-600/20
                transition-all
                flex items-center justify-center gap-2
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <>
                  <span
                    className="
                      w-4 h-4
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                      animate-spin
                    "
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register */}
          <div className="mt-7 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?
              <Link
                to="/register"
                className="ml-1.5 font-semibold text-violet-400 hover:text-violet-300 transition"
              >
                Create account
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

export default Login;
