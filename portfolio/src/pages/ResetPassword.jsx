// pages/ResetPassword.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowLeftIcon,
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

const ResetPassword = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const otpRefs = useRef([]);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const strength = getPasswordStrength(newPassword);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  // =========================================================
  // OTP CHANGE
  // =========================================================
  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      const updatedOtp = [...otp];
      updatedOtp[index] = "";
      setOtp(updatedOtp);
      return;
    }

    const updatedOtp = [...otp];

    // Handle paste / multiple digits
    if (cleanValue.length > 1) {
      const digits = cleanValue.slice(0, 6);

      digits.split("").forEach((digit, i) => {
        if (index + i < 6) {
          updatedOtp[index + i] = digit;
        }
      });

      setOtp(updatedOtp);

      const nextIndex = Math.min(index + digits.length, 5);

      setTimeout(() => {
        otpRefs.current[nextIndex]?.focus();
      }, 0);

      return;
    }

    updatedOtp[index] = cleanValue;
    setOtp(updatedOtp);

    if (index < 5) {
      setTimeout(() => {
        otpRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  // =========================================================
  // OTP KEYBOARD
  // =========================================================
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const updatedOtp = [...otp];
        updatedOtp[index] = "";
        setOtp(updatedOtp);
        return;
      }

      if (index > 0) {
        const updatedOtp = [...otp];
        updatedOtp[index - 1] = "";
        setOtp(updatedOtp);

        setTimeout(() => {
          otpRefs.current[index - 1]?.focus();
        }, 0);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // =========================================================
  // OTP PASTE
  // =========================================================
  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedData) return;

    const updatedOtp = ["", "", "", "", "", ""];

    pastedData.split("").forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);

    const focusIndex = Math.min(pastedData.length, 5);

    setTimeout(() => {
      otpRefs.current[focusIndex]?.focus();
    }, 0);
  };

  // =========================================================
  // SUBMIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email, otpCode, newPassword);

      if (result?.success) {
        toast.success("Password reset successfully");

        navigate("/login", {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(error?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080712]">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main gradient */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.20),transparent_35%)]
          "
        />

        {/* Purple glow */}
        <div
          className="
            absolute
            top-[-180px]
            left-[8%]
            w-[450px]
            h-[450px]
            rounded-full
            bg-purple-600/20
            blur-[130px]
          "
        />

        {/* Blue glow */}
        <div
          className="
            absolute
            bottom-[-180px]
            right-[8%]
            w-[500px]
            h-[500px]
            rounded-full
            bg-blue-600/20
            blur-[130px]
          "
        />

        {/* Pink glow */}
        <div
          className="
            absolute
            top-[35%]
            right-[30%]
            w-[300px]
            h-[300px]
            rounded-full
            bg-fuchsia-500/10
            blur-[110px]
          "
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* ===================================================
            LEFT PANEL
        ==================================================== */}
        <section className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="
                relative
                w-12
                h-12
                rounded-2xl
                bg-gradient-to-br
                from-violet-500
                to-fuchsia-500
                flex
                items-center
                justify-center
                shadow-lg
                shadow-purple-500/30
              "
            >
              <div
                className="
                  absolute
                  inset-[2px]
                  rounded-[14px]
                  bg-[#0d0b18]
                "
              />

              <div
                className="
                  relative
                  w-5
                  h-5
                  rounded-lg
                  bg-gradient-to-br
                  from-violet-400
                  to-white
                "
              />
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

          {/* Main Left Content */}
          <div className="max-w-xl">
            {/* Badge */}
            <div
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                bg-white/[0.06]
                border
                border-white/10
                backdrop-blur-xl
                mb-8
              "
            >
              <ShieldCheckIcon className="w-4 h-4 text-violet-300" />

              <span className="text-xs text-white/70 font-medium">
                Secure account recovery
              </span>
            </div>

            {/* Heading */}
            <h2
              className="
                text-5xl
                xl:text-6xl
                font-bold
                tracking-[-0.04em]
                leading-[1.05]
                text-white
              "
            >
              Create a new
              <br />
              <span
                className="
                  bg-gradient-to-r
                  from-violet-400
                  via-purple-300
                  to-blue-400
                  bg-clip-text
                  text-transparent
                "
              >
                secure password.
              </span>
            </h2>

            <p
              className="
                mt-7
                max-w-lg
                text-white/50
                text-base
                leading-7
              "
            >
              Verify your email with the OTP and choose a new password to secure
              your MyApp account.
            </p>

            {/* Steps */}
            <div className="mt-10 space-y-4">
              {/* Step 1 */}
              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-4
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-violet-500/10
                    border
                    border-violet-400/10
                    flex
                    items-center
                    justify-center
                    text-violet-300
                    text-sm
                    font-bold
                  "
                >
                  01
                </div>

                <div>
                  <p className="text-white text-sm font-semibold">
                    Verify your email
                  </p>

                  <p className="text-white/35 text-xs mt-1">
                    Enter the 6 digit verification code
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-4
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-500/10
                    border
                    border-blue-400/10
                    flex
                    items-center
                    justify-center
                    text-blue-300
                    text-sm
                    font-bold
                  "
                >
                  02
                </div>

                <div>
                  <p className="text-white text-sm font-semibold">
                    Create new password
                  </p>

                  <p className="text-white/35 text-xs mt-1">
                    Choose a strong password for your account
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-4
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-fuchsia-500/10
                    border
                    border-fuchsia-400/10
                    flex
                    items-center
                    justify-center
                    text-fuchsia-300
                    text-sm
                    font-bold
                  "
                >
                  03
                </div>

                <div>
                  <p className="text-white text-sm font-semibold">
                    Continue securely
                  </p>

                  <p className="text-white/35 text-xs mt-1">
                    Sign in with your new password
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <ShieldCheckIcon className="w-4 h-4" />
            Your account security is important to us.
          </div>
        </section>

        {/* ===================================================
            RIGHT PANEL
        ==================================================== */}
        <section
          className="
            flex
            items-center
            justify-center
            px-5
            py-8
            sm:px-8
            lg:px-12
            xl:px-20
          "
        >
          <div className="w-full max-w-[480px]">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-gradient-to-br
                  from-violet-500
                  to-fuchsia-500
                  flex
                  items-center
                  justify-center
                  shadow-lg
                  shadow-purple-500/30
                "
              >
                <div className="w-5 h-5 rounded-lg bg-white" />
              </div>

              <div>
                <h1 className="text-white font-bold text-lg">MyApp</h1>

                <p className="text-white/40 text-[9px] uppercase tracking-[0.2em]">
                  Business Workspace
                </p>
              </div>
            </div>

            {/* Card */}
            <div
              className="
                relative
                rounded-[32px]
                border
                border-white/[0.08]
                bg-white/[0.06]
                backdrop-blur-2xl
                shadow-2xl
                shadow-black/30
                p-6
                sm:p-9
              "
            >
              {/* Card Glow */}
              <div
                className="
                  absolute
                  -top-20
                  right-0
                  w-40
                  h-40
                  bg-purple-500/10
                  blur-[80px]
                  pointer-events-none
                "
              />

              <div className="relative">
                {/* Header */}
                <div className="mb-7">
                  <p className="text-violet-300 text-sm font-medium mb-3">
                    Account recovery
                  </p>

                  <h2
                    className="
                      text-3xl
                      sm:text-4xl
                      font-bold
                      tracking-tight
                      text-white
                    "
                  >
                    Reset password
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Enter the verification code sent to
                    <br />
                    <span className="text-white/70 font-medium break-all">
                      {email}
                    </span>
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* =================================================
                      OTP
                  ================================================== */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium text-white/60">
                        Verification code
                      </label>

                      <span className="text-[10px] text-white/25">
                        6 digits
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpRefs.current[index] = el;
                          }}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className={`
                            w-full
                            aspect-square
                            min-w-0
                            rounded-2xl
                            border
                            bg-black/20
                            text-center
                            text-xl
                            sm:text-2xl
                            font-bold
                            text-white
                            outline-none
                            transition-all
                            ${
                              digit
                                ? "border-violet-400/60 bg-violet-500/[0.08] shadow-lg shadow-violet-500/5"
                                : "border-white/[0.08]"
                            }
                            focus:border-violet-400/70
                            focus:bg-violet-500/[0.08]
                            focus:ring-4
                            focus:ring-violet-500/10
                          `}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[10px] text-white/25">
                        Enter the code from your email
                      </p>

                      {otp.join("").length === 6 && (
                        <div className="flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />

                          <span className="text-[10px] text-emerald-400">
                            Code complete
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =================================================
                      NEW PASSWORD
                  ================================================== */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="
                        block
                        mb-2
                        text-xs
                        font-medium
                        text-white/60
                      "
                    >
                      New password
                    </label>

                    <div className="relative">
                      <LockClosedIcon
                        className="
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          w-[18px]
                          h-[18px]
                          text-white/30
                          pointer-events-none
                        "
                      />

                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="
                          w-full
                          h-[54px]
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
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-white/30
                          hover:text-white
                          transition-colors
                        "
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-[18px] h-[18px]" />
                        ) : (
                          <EyeIcon className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>

                    {/* Strength */}
                    {newPassword && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-white/30">
                            Password strength
                          </span>

                          <span
                            className={`
                              text-[10px]
                              font-semibold
                              ${
                                strength.label === "Weak"
                                  ? "text-red-400"
                                  : strength.label === "Fair"
                                    ? "text-yellow-400"
                                    : strength.label === "Good"
                                      ? "text-blue-400"
                                      : "text-emerald-400"
                              }
                            `}
                          >
                            {strength.label}
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`
                              h-full
                              rounded-full
                              transition-all
                              duration-500
                              ${strength.color}
                            `}
                            style={{
                              width: strength.width,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      CONFIRM PASSWORD
                  ================================================== */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="
                        block
                        mb-2
                        text-xs
                        font-medium
                        text-white/60
                      "
                    >
                      Confirm new password
                    </label>

                    <div className="relative">
                      <LockClosedIcon
                        className={`
                          absolute
                          left-4
                          top-1/2
                          -translate-y-1/2
                          w-[18px]
                          h-[18px]
                          pointer-events-none
                          ${
                            passwordsMatch
                              ? "text-emerald-400"
                              : "text-white/30"
                          }
                        `}
                      />

                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className={`
                          w-full
                          h-[54px]
                          pl-12
                          pr-12
                          rounded-2xl
                          border
                          bg-black/20
                          text-white
                          text-sm
                          placeholder:text-white/20
                          outline-none
                          transition-all
                          focus:ring-4
                          ${
                            confirmPassword && newPassword !== confirmPassword
                              ? "border-red-500/50 focus:border-red-400/60 focus:ring-red-500/10"
                              : passwordsMatch
                                ? "border-emerald-500/40 focus:border-emerald-400/60 focus:ring-emerald-500/10"
                                : "border-white/[0.08] focus:border-violet-400/60 focus:ring-violet-500/10"
                          }
                        `}
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-white/30
                          hover:text-white
                          transition-colors
                        "
                        aria-label={
                          showConfirm
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirm ? (
                          <EyeSlashIcon className="w-[18px] h-[18px]" />
                        ) : (
                          <EyeIcon className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>

                    {/* Match */}
                    {confirmPassword && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {passwordsMatch ? (
                          <>
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />

                            <span className="text-[10px] text-emerald-400">
                              Passwords match
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />

                            <span className="text-[10px] text-red-400">
                              Passwords do not match
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      SUBMIT
                  ================================================== */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      group
                      relative
                      overflow-hidden
                      w-full
                      h-[56px]
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
                    {/* Shine */}
                    <span
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-transparent
                        via-white/10
                        to-transparent
                        -translate-x-full
                        group-hover:translate-x-full
                        transition-transform
                        duration-700
                      "
                    />

                    <span className="relative flex items-center justify-center gap-2">
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
                          Resetting password...
                        </>
                      ) : (
                        <>
                          Reset password
                          <ArrowRightIcon
                            className="
                              w-4
                              h-4
                              transition-transform
                              group-hover:translate-x-1
                            "
                          />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-7 text-center">
                  <Link
                    to="/login"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-xs
                      text-white/35
                      hover:text-violet-300
                      transition-colors
                    "
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="mt-5 flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-white/20" />

              <p className="text-[10px] text-white/20">
                Your password is protected by secure authentication
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ResetPassword;
