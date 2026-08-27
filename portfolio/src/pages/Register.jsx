// pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckCircleIcon,
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            left-[5%]
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
            right-[5%]
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
            right-[35%]
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
          MAIN LAYOUT
      ====================================================== */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* ===================================================
            LEFT SIDE
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

          {/* Main Content */}
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
              <SparklesIcon className="w-4 h-4 text-violet-300" />

              <span className="text-xs text-white/70 font-medium">
                Start your journey
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
              Build your
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
                smarter workspace.
              </span>
            </h2>

            {/* Description */}
            <p
              className="
                mt-7
                max-w-lg
                text-white/50
                text-base
                leading-7
              "
            >
              Create your account and manage your business operations, reports,
              sales and daily tools from one secure workspace.
            </p>

            {/* Feature Cards */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-5
                  hover:bg-white/[0.05]
                  transition-all
                "
              >
                <div className="flex items-center gap-3">
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
                    "
                  >
                    <CheckCircleIcon className="w-5 h-5 text-violet-300" />
                  </div>

                  <div>
                    <p className="text-white text-sm font-semibold">Reports</p>

                    <p className="text-white/35 text-xs mt-1">
                      Real-time insights
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-5
                  hover:bg-white/[0.05]
                  transition-all
                "
              >
                <div className="flex items-center gap-3">
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
                    "
                  >
                    <CheckCircleIcon className="w-5 h-5 text-blue-300" />
                  </div>

                  <div>
                    <p className="text-white text-sm font-semibold">Expenses</p>

                    <p className="text-white/35 text-xs mt-1">
                      Track every rupee
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-5
                  hover:bg-white/[0.05]
                  transition-all
                "
              >
                <div className="flex items-center gap-3">
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
                    "
                  >
                    <CheckCircleIcon className="w-5 h-5 text-fuchsia-300" />
                  </div>

                  <div>
                    <p className="text-white text-sm font-semibold">Sales</p>

                    <p className="text-white/35 text-xs mt-1">
                      Daily summaries
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div
                className="
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  backdrop-blur-xl
                  p-5
                  hover:bg-white/[0.05]
                  transition-all
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-indigo-500/10
                      border
                      border-indigo-400/10
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <CheckCircleIcon className="w-5 h-5 text-indigo-300" />
                  </div>

                  <div>
                    <p className="text-white text-sm font-semibold">Bills</p>

                    <p className="text-white/35 text-xs mt-1">
                      Quick generation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3 text-white/30 text-xs">
            <ShieldCheckIcon className="w-4 h-4" />
            Secure workspace. Your data stays protected.
          </div>
        </section>

        {/* ===================================================
            RIGHT SIDE
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

            {/* Registration Card */}
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
                {/* Heading */}
                <div className="mb-7">
                  <p className="text-violet-300 text-sm font-medium mb-3">
                    Create your account
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
                    Get started
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Create your account and start managing your workspace.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* =================================================
                      NAME
                  ================================================== */}
                  <div>
                    <label
                      htmlFor="name"
                      className="
                        block
                        mb-2
                        text-xs
                        font-medium
                        text-white/60
                      "
                    >
                      Full name
                    </label>

                    <div className="relative">
                      <UserIcon
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
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="
                          w-full
                          h-[54px]
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

                  {/* =================================================
                      EMAIL
                  ================================================== */}
                  <div>
                    <label
                      htmlFor="email"
                      className="
                        block
                        mb-2
                        text-xs
                        font-medium
                        text-white/60
                      "
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <EnvelopeIcon
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
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="
                          w-full
                          h-[54px]
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

                  {/* =================================================
                      PASSWORD
                  ================================================== */}
                  <div>
                    <label
                      htmlFor="password"
                      className="
                        block
                        mb-2
                        text-xs
                        font-medium
                        text-white/60
                      "
                    >
                      Password
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
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
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

                    {/* Password Strength */}
                    {formData.password && (
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
                      Confirm password
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
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
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
                            formData.confirmPassword &&
                            formData.password !== formData.confirmPassword
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

                    {/* Match Status */}
                    {formData.confirmPassword && (
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

                  {/* Terms */}
                  <div className="flex items-start gap-3 pt-2">
                    <div
                      className="
                        w-[18px]
                        h-[18px]
                        rounded-md
                        bg-violet-500/10
                        border
                        border-violet-400/20
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                        mt-0.5
                      "
                    >
                      <CheckIcon className="w-3 h-3 text-violet-300" />
                    </div>

                    <p className="text-[10px] leading-5 text-white/35">
                      By creating an account, you agree to our{" "}
                      <span className="text-white/60">Terms of Service</span>{" "}
                      and <span className="text-white/60">Privacy Policy</span>.
                    </p>
                  </div>

                  {/* =================================================
                      CREATE ACCOUNT BUTTON
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
                    {/* Button shine */}
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
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
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

                <p className="mt-7 text-center text-sm text-white/40">
                  Already have an account?
                  <Link
                    to="/login"
                    className="
                      ml-1.5
                      font-semibold
                      text-violet-300
                      hover:text-violet-200
                      transition-colors
                    "
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Security */}
            <div className="mt-5 flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-white/20" />

              <p className="text-[10px] text-white/20">
                Protected by secure authentication
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
