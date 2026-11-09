// pages/Register.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  AuthLayout,
  Field,
  PasswordField,
  StrengthMeter,
  SubmitButton,
  getPasswordStrength,
} from "./AuthParts";

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
  const mismatch = formData.confirmPassword && !passwordsMatch;

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your access to the workspace"
      footer={
        <>
          Already have an account?
          <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="au-form">
        <Field
          id="name"
          name="name"
          label="Full name"
          icon={User}
          type="text"
          autoComplete="name"
          required
          value={formData.name}
          onChange={handleChange}
        />

        <Field
          id="email"
          name="email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />

        <div className="au-field">
          <PasswordField
            id="password"
            name="password"
            label="Password"
            icon={Lock}
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            show={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
            toggleLabel={{ show: "Show password", hide: "Hide password" }}
          />
          <StrengthMeter strength={strength} />
        </div>

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          icon={Lock}
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          state={mismatch ? "bad" : passwordsMatch ? "ok" : undefined}
          hint={
            formData.confirmPassword
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

        <p className="au-note">
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>

        <SubmitButton loading={loading} loadingText="Creating account">
          Create account
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default Register;
