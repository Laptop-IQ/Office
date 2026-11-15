import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, Field, PasswordField, SubmitButton } from "./AuthParts";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const { login, guestLogin } = useAuth();
  const [guestLoading, setGuestLoading] = useState(false);
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

  const handleGuest = async () => {
    if (guestLoading || loading) return;
    setGuestLoading(true);
    const result = await guestLogin(); // reloads the page on success
    if (!result?.success) setGuestLoading(false);
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your email and password to open the workspace"
      footer={
        <>
          Don&apos;t have an account?
          <Link to="/register">Create account</Link>
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
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <PasswordField
          id="password"
          label="Password"
          icon={Lock}
          side={
            <Link to="/forgot-password" className="au-link">
              Forgot password?
            </Link>
          }
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          show={showPassword}
          onToggle={() => setShowPassword((prev) => !prev)}
          toggleLabel={{ show: "Show password", hide: "Hide password" }}
        />

        <label className="au-check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Keep me signed in
        </label>

        <SubmitButton loading={loading} loadingText="Signing in">
          Sign in
        </SubmitButton>
      </form>

      <div className="au-divider" role="separator">
        <span>or</span>
      </div>
      <button
        type="button"
        className="au-btn au-btn--ghost"
        onClick={handleGuest}
        disabled={guestLoading || loading}
      >
        {guestLoading ? (
          <>
            <span className="au-spinner" aria-hidden="true" />
            Preparing demo
          </>
        ) : (
          <>
            <Eye size={18} strokeWidth={1.5} aria-hidden="true" />
            Continue as Guest (demo)
          </>
        )}
      </button>
      <p className="au-note">
        Try the app with sample data. Change anything you like — everything
        resets when you log out.
      </p>
    </AuthLayout>
  );
};

export default Login;
