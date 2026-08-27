// pages/VerifyOTP.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const VerifyOTP = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;

    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const code = newOtp.join("");

      if (code.length === 6) {
        submitOtp(code);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = ["", "", "", "", "", ""];

    pasted.split("").forEach((char, index) => {
      newOtp[index] = char;
    });

    setOtp(newOtp);

    const nextEmpty = newOtp.findIndex((digit) => digit === "");

    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  };

  const submitOtp = async (code) => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await verifyOTP(email, code);

      if (result?.success) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    await submitOtp(code);
  };

  const handleResend = async () => {
    if (resendLoading) return;

    setResendLoading(true);

    try {
      const result = await resendOTP(email);

      if (result?.success) {
        setTimer(60);
        setOtp(["", "", "", "", "", ""]);

        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60,
    ).padStart(2, "0")}`;
  };

  const isComplete = otp.join("").length === 6;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080712]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.20),transparent_35%)]" />

        <div className="absolute top-[-160px] left-[8%] w-[420px] h-[420px] rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="absolute bottom-[-160px] right-[8%] w-[460px] h-[460px] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute top-[35%] left-[45%] w-[320px] h-[320px] rounded-full bg-fuchsia-500/10 blur-[110px]" />

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
                Secure email verification
              </span>
            </div>

            <h2 className="text-5xl xl:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-white">
              One step away
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                from your workspace.
              </span>
            </h2>

            <p className="mt-7 max-w-lg text-white/50 text-base leading-7">
              Verify your email address with the 6-digit code we sent you. Your
              account will be ready once verification is complete.
            </p>

            {/* Verification status */}
            <div className="mt-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-violet-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Verification protected
                  </p>

                  <p className="text-xs text-white/35 mt-1">
                    Your verification code is securely processed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <ShieldCheckIcon className="w-4 h-4" />
            Secure authentication. Your account stays protected.
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
              to="/register"
              className="group inline-flex items-center gap-2 mb-6 text-xs font-medium text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to registration
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

                    <ShieldCheckIcon className="relative w-7 h-7 text-violet-300" />
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-8">
                  <p className="text-violet-300 text-sm font-medium mb-3">
                    Email verification
                  </p>

                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    Verify your email
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Enter the 6-digit code we sent to your email address.
                  </p>
                </div>

                {/* Email */}
                <div className="mb-7 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <EnvelopeIcon className="w-4 h-4 text-violet-300" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                      Code sent to
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-white/75 truncate">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* OTP */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium text-white/60">
                        Enter verification code
                      </label>

                      <span className="text-[11px] text-white/25">
                        6 digits
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-6 gap-2 sm:gap-3"
                      onPaste={handlePaste}
                    >
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          aria-label={`OTP digit ${index + 1}`}
                          className={`
                            w-full
                            h-[58px]
                            sm:h-[62px]
                            text-center
                            text-xl
                            font-bold
                            rounded-2xl
                            border
                            outline-none
                            transition-all
                            duration-200
                            ${
                              digit
                                ? "border-violet-400/60 bg-violet-500/10 text-white shadow-lg shadow-violet-900/10"
                                : "border-white/[0.08] bg-black/20 text-white hover:border-white/20 focus:border-violet-400/60 focus:bg-black/30 focus:ring-4 focus:ring-violet-500/10"
                            }
                          `}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Security info */}
                  <div className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5">
                    <ShieldCheckIcon className="w-5 h-5 flex-shrink-0 text-violet-300/70 mt-0.5" />

                    <p className="text-xs leading-5 text-white/35">
                      Never share your verification code with anyone. Our team
                      will never ask you for this code.
                    </p>
                  </div>

                  {/* Verify */}
                  <button
                    type="submit"
                    disabled={loading || !isComplete}
                    className="
                      group
                      relative
                      w-full
                      h-[58px]
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
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      disabled:hover:translate-y-0
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
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify email
                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    {timer > 0 ? (
                      <p className="text-xs text-white/35">
                        Didn't receive the code? Resend in{" "}
                        <span className="font-semibold text-white/60 tabular-nums">
                          {formatTime(timer)}
                        </span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-sm font-semibold text-violet-300 hover:text-violet-200 disabled:opacity-50 transition-colors"
                      >
                        {resendLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <svg
                              className="w-4 h-4 animate-spin"
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
                            Sending code...
                          </span>
                        ) : (
                          "Resend OTP"
                        )}
                      </button>
                    )}
                  </div>
                </form>

                {/* Wrong email */}
                <p className="mt-8 text-center text-sm text-white/40">
                  Wrong email?
                  <Link
                    to="/register"
                    className="ml-1.5 font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    Go back
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

export default VerifyOTP;
