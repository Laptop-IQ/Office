import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, Field, SubmitButton } from "./AuthParts";

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
    <AuthLayout
      title="Forgot your password"
      subtitle="Enter your email and we will send you a 6-digit OTP to reset it"
      back={{ to: "/login", label: "Back to sign in" }}
      footer={
        <>
          Remember your password?
          <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="au-form">
        <Field
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />

        <SubmitButton loading={loading} loadingText="Sending OTP">
          Send OTP
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
