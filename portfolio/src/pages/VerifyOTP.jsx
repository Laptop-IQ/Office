// pages/VerifyOTP.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // ✅ Link added
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

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
    if (!email) navigate("/register");
    else inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
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
    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const filled = [...newOtp.slice(0, 5), digit];
      if (filled.every((d) => d !== "")) {
        submitOtp(filled.join(""));
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
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const submitOtp = async (code) => {
    setLoading(true);
    const result = await verifyOTP(email, code);
    if (result?.success) navigate("/dashboard");
    setLoading(false);
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
    setResendLoading(true);
    const result = await resendOTP(email);
    if (result?.success) {
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setResendLoading(false);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-gray-700">{email}</span>. Enter it
            below to verify your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter 6-digit code
            </label>
            <div className="flex gap-2.5 justify-between" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-12 text-center text-lg font-bold rounded-xl border-2 focus:outline-none transition-all ${
                    digit
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-900 focus:border-blue-400 focus:bg-blue-50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </button>

          {/* Resend */}
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in{" "}
                <span className="font-semibold text-gray-700 tabular-nums">
                  {formatTime(timer)}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Wrong email?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
