// pages/VerifyOTP.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { AuthLayout, OtpRow, SubmitButton } from "./AuthParts";

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
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          Code sent to <strong>{email}</strong>
        </>
      }
      back={{ to: "/register", label: "Back to registration" }}
      footer={
        <>
          Wrong email?
          <Link to="/register">Go back</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="au-form">
        <div className="au-field">
          <span className="au-label" id="otp-label">
            Verification code
          </span>
          <OtpRow
            otp={otp}
            refs={inputRefs}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        </div>

        <p className="au-note">
          Never share your verification code with anyone. Our team will never
          ask you for this code.
        </p>

        <SubmitButton
          loading={loading}
          loadingText="Verifying"
          disabled={!isComplete}
        >
          Verify email
        </SubmitButton>

        <div className="au-center">
          {timer > 0 ? (
            <p className="au-note">
              Didn&apos;t receive the code? Resend in{" "}
              <span className="au-num">{formatTime(timer)}</span>
            </p>
          ) : (
            <button
              type="button"
              className="au-text-btn"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending code" : "Resend OTP"}
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};

export default VerifyOTP;
