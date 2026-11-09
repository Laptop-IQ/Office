// pages/ResetPassword.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  AuthLayout,
  OtpRow,
  PasswordField,
  StrengthMeter,
  SubmitButton,
  getPasswordStrength,
} from "./AuthParts";

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

  const otpComplete = otp.join("").length === 6;
  const mismatch = confirmPassword.length > 0 && !passwordsMatch;

  return (
    <AuthLayout
      title="Reset password"
      subtitle={
        <>
          Enter the verification code sent to <strong>{email}</strong>
        </>
      }
      back={{ to: "/login", label: "Back to sign in" }}
    >
      <form onSubmit={handleSubmit} className="au-form">
        <div className="au-field">
          <span className="au-label">Verification code</span>
          <OtpRow
            otp={otp}
            refs={otpRefs}
            onChange={handleOtpChange}
            onKeyDown={handleOtpKeyDown}
            onPaste={handleOtpPaste}
          />
          <p className="au-hint" data-tone={otpComplete ? "ok" : undefined}>
            {otpComplete ? "Code complete" : "Enter the code from your email"}
          </p>
        </div>

        <div className="au-field">
          <PasswordField
            id="newPassword"
            label="New password"
            icon={Lock}
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            show={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
            toggleLabel={{ show: "Show password", hide: "Hide password" }}
          />
          <StrengthMeter strength={strength} />
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          icon={Lock}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          state={mismatch ? "bad" : passwordsMatch ? "ok" : undefined}
          hint={
            confirmPassword.length > 0
              ? passwordsMatch
                ? "Passwords match"
                : "Passwords do not match"
              : undefined
          }
          hintTone={mismatch ? "bad" : "ok"}
          show={showConfirm}
          onToggle={() => setShowConfirm((prev) => !prev)}
          toggleLabel={{ show: "Show confirm password", hide: "Hide confirm password" }}
        />

        <SubmitButton loading={loading} loadingText="Resetting password">
          Reset password
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
