import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
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
    <main className="relative min-h-screen overflow-hidden bg-[#080712]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.20),transparent_35%)]" />

        <div className="absolute top-[-150px] left-[10%] w-[420px] h-[420px] rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="absolute bottom-[-150px] right-[10%] w-[450px] h-[450px] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute top-[40%] left-[45%] w-[300px] h-[300px] rounded-full bg-fuchsia-500/10 blur-[100px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT SIDE */}
        <section className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <div className="absolute inset-[2px] rounded-[14px] bg-[#0d0b18]" />

              <div className="relative w-5 h-5 rounded-lg bg-gradient-to-br from-violet-400 to-white" />
            </div>

            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">
                MyApp
              </h1>

              <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase">
                Business Workspace
              </p>
            </div>
          </div>

          {/* Hero */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl mb-8">
              <SparklesIcon className="w-4 h-4 text-violet-300" />

              <span className="text-xs text-white/70 font-medium">
                Smart business management
              </span>
            </div>

            <h2 className="text-5xl xl:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-white">
              Everything your
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                business needs.
              </span>
            </h2>

            <p className="mt-7 max-w-lg text-white/50 text-base leading-7">
              Manage operations, track sales and keep your business organized
              from one secure workspace.
            </p>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
                <p className="text-2xl font-bold text-white">24/7</p>

                <p className="text-xs text-white/40 mt-1">Access</p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
                <p className="text-2xl font-bold text-white">100%</p>

                <p className="text-xs text-white/40 mt-1">Secure</p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
                <p className="text-2xl font-bold text-white">One</p>

                <p className="text-xs text-white/40 mt-1">Workspace</p>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <ShieldCheckIcon className="w-4 h-4" />
            Secure workspace. Your data stays protected.
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[460px]">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-12">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <div className="w-5 h-5 rounded-lg bg-white" />
              </div>

              <div>
                <h1 className="text-white font-bold text-lg">MyApp</h1>

                <p className="text-white/40 text-[9px] uppercase tracking-[0.2em]">
                  Business Workspace
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="relative rounded-[32px] border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/30 p-6 sm:p-10">
              {/* Card glow */}
              <div className="absolute -top-20 right-0 w-40 h-40 bg-purple-500/10 blur-[80px] pointer-events-none" />

              <div className="relative">
                {/* Heading */}
                <div className="mb-9">
                  <p className="text-violet-300 text-sm font-medium mb-3">
                    Welcome back
                  </p>

                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    Sign in to continue
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Enter your account details to access your workspace.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-xs font-medium text-white/60"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 pointer-events-none" />

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="
                          w-full
                          h-[58px]
                          pl-12
                          pr-4
                          rounded-2xl
                          border
                          border-white/[0.08]
                          bg-black/20
                          text-white
                          text-sm
                          placeholder:text-white/20
                          outline-none
                          transition-all
                          focus:border-violet-400/60
                          focus:bg-black/30
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
                        className="text-xs font-medium text-white/60"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 pointer-events-none" />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="
                          w-full
                          h-[58px]
                          pl-12
                          pr-12
                          rounded-2xl
                          border
                          border-white/[0.08]
                          bg-black/20
                          text-white
                          text-sm
                          placeholder:text-white/20
                          outline-none
                          transition-all
                          focus:border-violet-400/60
                          focus:bg-black/30
                          focus:ring-4
                          focus:ring-violet-500/10
                        "
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-[18px] h-[18px]" />
                        ) : (
                          <EyeIcon className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember */}
                  <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="sr-only peer"
                    />

                    <span
                      className="
                      w-[19px]
                      h-[19px]
                      rounded-md
                      border
                      border-white/20
                      bg-white/[0.04]
                      flex
                      items-center
                      justify-center
                      transition-all
                      peer-checked:bg-violet-500
                      peer-checked:border-violet-500
                    "
                    >
                      {remember && (
                        <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </span>

                    <span className="text-xs text-white/45">
                      Keep me signed in
                    </span>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      group
                      relative
                      w-full
                      h-[58px]
                      mt-2
                      rounded-2xl
                      bg-gradient-to-r
                      from-violet-600
                      via-purple-600
                      to-fuchsia-600
                      text-white
                      text-sm
                      font-semibold
                      shadow-lg
                      shadow-purple-900/30
                      transition-all
                      hover:brightness-110
                      hover:-translate-y-[1px]
                      active:translate-y-0
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >
                    {loading ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="opacity-30"
                          />

                          <path
                            d="M12 3a9 9 0 019 9"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Register */}
                <p className="mt-8 text-center text-sm text-white/40">
                  New here?
                  <Link
                    to="/register"
                    className="ml-1.5 font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom */}
            <p className="mt-6 text-center text-[11px] text-white/20">
              Protected by secure authentication
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
