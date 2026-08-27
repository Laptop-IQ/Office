import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result?.success) {
        navigate("/reset-password", {
          state: { email },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080712]">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Main gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.20),transparent_35%)]" />

        {/* Purple glow */}
        <div className="absolute top-[-160px] left-[8%] w-[420px] h-[420px] rounded-full bg-purple-600/20 blur-[120px]" />

        {/* Blue glow */}
        <div className="absolute bottom-[-160px] right-[8%] w-[460px] h-[460px] rounded-full bg-blue-600/20 blur-[120px]" />

        {/* Center glow */}
        <div className="absolute top-[35%] left-[45%] w-[320px] h-[320px] rounded-full bg-fuchsia-500/10 blur-[110px]" />

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
                Secure account recovery
              </span>
            </div>

            <h2 className="text-5xl xl:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-white">
              Get back to your
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                workspace.
              </span>
            </h2>

            <p className="mt-7 max-w-lg text-white/50 text-base leading-7">
              Enter the email connected to your account. We will send you a
              secure 6-digit OTP to reset your password.
            </p>

            {/* Steps */}
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-violet-300">
                    01
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Verify your email
                  </p>

                  <p className="text-xs text-white/35 mt-0.5">
                    Enter your registered email address
                  </p>
                </div>
              </div>

              <div className="w-px h-5 bg-white/10 ml-5" />

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-300">
                    02
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Enter your OTP
                  </p>

                  <p className="text-xs text-white/35 mt-0.5">
                    Use the 6-digit code sent to your email
                  </p>
                </div>
              </div>

              <div className="w-px h-5 bg-white/10 ml-5" />

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-fuchsia-300">
                    03
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Create new password
                  </p>

                  <p className="text-xs text-white/35 mt-0.5">
                    Set a new password and continue
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <ShieldCheckIcon className="w-4 h-4" />
            Your account recovery is protected by secure authentication.
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[460px]">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-10">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <div className="absolute inset-[2px] rounded-[14px] bg-[#0d0b18]" />

                <div className="relative w-5 h-5 rounded-lg bg-white" />
              </div>

              <div>
                <h1 className="text-white font-bold text-lg">MyApp</h1>

                <p className="text-white/40 text-[9px] uppercase tracking-[0.2em]">
                  Business Workspace
                </p>
              </div>
            </div>

            {/* Back */}
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 mb-6 text-xs font-medium text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to sign in
            </Link>

            {/* Card */}
            <div className="relative rounded-[32px] border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/30 p-6 sm:p-10">
              {/* Card glow */}
              <div className="absolute -top-20 right-0 w-40 h-40 bg-purple-500/10 blur-[80px] pointer-events-none" />

              <div className="relative">
                {/* Icon */}
                <div className="mb-7">
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-purple-900/20">
                    <div className="absolute inset-0 rounded-2xl bg-violet-500/5 blur-xl" />

                    <EnvelopeIcon className="relative w-6 h-6 text-violet-300" />
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-8">
                  <p className="text-violet-300 text-sm font-medium mb-3">
                    Account recovery
                  </p>

                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    Forgot your password?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    No worries. Enter your email and we will send you a 6-digit
                    OTP to securely reset your password.
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

                  {/* Info */}
                  <div className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5">
                    <ShieldCheckIcon className="w-5 h-5 flex-shrink-0 text-violet-300/70 mt-0.5" />

                    <p className="text-xs leading-5 text-white/35">
                      We will send a secure 6-digit verification code to your
                      email. Check your inbox and spam folder.
                    </p>
                  </div>

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
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Sign in */}
                <p className="mt-8 text-center text-sm text-white/40">
                  Remember your password?
                  <Link
                    to="/login"
                    className="ml-1.5 font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/20">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              Protected by secure authentication
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;
