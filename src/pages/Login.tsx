/**
 * Omega Swarm v5.0 — Login / Register Page
 *
 * Toggle between login and register modes.
 * Email + password validation, name field for registration.
 * "Continue as Guest" button with 1-day expiry.
 * Full error handling, loading states, lucide-react icons, Tailwind CSS.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2,
  UserCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/components/AuthProvider";

/* ─── Constants ─── */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Component ─── */

export default function Login() {
  const navigate = useNavigate();
  const { login, register, guest, isLoading, user } = useAuthContext();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* Redirect if already authenticated */
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  /* ─── Validation ─── */
  const validate = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    if (mode === "register" && !consent) {
      nextErrors.consent = "You must agree to the Privacy Policy to create an account";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [email, password, name, mode, consent]);

  /* ─── Submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      if (mode === "login") {
        await login(email.trim(), password);
        toast.success("Welcome back to Omega Swarm!");
      } else {
        await register(name.trim(), email.trim(), password);
        toast.success("Account created — welcome to Omega Swarm!");
      }
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Something went wrong. Please try again.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  /* ─── Guest ─── */
  const handleGuest = async () => {
    setSubmitError(null);
    try {
      await guest();
      toast.success("Guest session started — limited features available.");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create guest session.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  /* ─── Toggle mode ─── */
  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setSubmitError(null);
    setErrors({});
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--bg-base, #0C0A09)" }}
    >
      <div className="w-full max-w-md">
        {/* ─── Logo ─── */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4 flex size-16 items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
              }}
            />
            <div
              className="relative flex size-16 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                boxShadow: "0 0 40px rgba(245,158,11,0.3)",
              }}
            >
              <Sparkles className="size-8 text-white" />
            </div>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary, #FAFAF9)" }}
          >
            Omega Swarm
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary, #A8A29E)" }}
          >
            Autonomous Marketing Intelligence
          </p>
        </div>

        {/* ─── Card ─── */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "var(--bg-card, rgba(28,25,23,0.85))",
            border: "1px solid var(--border-subtle, #29221D)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {mode === "login" ? (
              <LogIn className="size-5" style={{ color: "var(--text-primary, #FAFAF9)" }} />
            ) : (
              <UserPlus className="size-5" style={{ color: "var(--text-primary, #FAFAF9)" }} />
            )}
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary, #FAFAF9)" }}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
          </div>

          {/* Server Error */}
          {submitError && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              {submitError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name (register only) */}
            {mode === "register" && (
              <div>
                <label
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted, #78716C)" }}
                >
                  <User className="size-3.5" />
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                    style={{
                      background: "var(--bg-elevated, #29221D)",
                      border: `1px solid ${errors.name ? "#EF4444" : "var(--border-subtle, #29221D)"}`,
                      color: "var(--text-primary, #FAFAF9)",
                    }}
                    onFocus={(e) => {
                      if (!errors.name) e.currentTarget.style.borderColor = "#F59E0B";
                    }}
                    onBlur={(e) => {
                      if (!errors.name) e.currentTarget.style.borderColor = "var(--border-subtle, #29221D)";
                    }}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted, #78716C)" }}
              >
                <Mail className="size-3.5" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                  }}
                  placeholder="you@company.com"
                  autoComplete={mode === "login" ? "email" : "username"}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: "var(--bg-elevated, #29221D)",
                    border: `1px solid ${errors.email ? "#EF4444" : "var(--border-subtle, #29221D)"}`,
                    color: "var(--text-primary, #FAFAF9)",
                  }}
                  onFocus={(e) => {
                    if (!errors.email) e.currentTarget.style.borderColor = "#F59E0B";
                  }}
                  onBlur={(e) => {
                    if (!errors.email) e.currentTarget.style.borderColor = "var(--border-subtle, #29221D)";
                  }}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted, #78716C)" }}
              >
                <Lock className="size-3.5" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: "var(--bg-elevated, #29221D)",
                    border: `1px solid ${errors.password ? "#EF4444" : "var(--border-subtle, #29221D)"}`,
                    color: "var(--text-primary, #FAFAF9)",
                  }}
                  onFocus={(e) => {
                    if (!errors.password) e.currentTarget.style.borderColor = "#F59E0B";
                  }}
                  onBlur={(e) => {
                    if (!errors.password) e.currentTarget.style.borderColor = "var(--border-subtle, #29221D)";
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:opacity-80"
                  style={{ color: "var(--text-muted, #78716C)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* GDPR Consent (register only) */}
            {mode === "register" && (
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (errors.consent) setErrors((p) => ({ ...p, consent: "" }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#29221D] text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I agree to the{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                      Privacy Policy
                    </a>
                    . I consent to data processing for account management, AI content generation, and platform analytics.
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                    {errors.consent}
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: isLoading
                  ? "var(--bg-elevated)"
                  : "linear-gradient(135deg, #F59E0B, #F97316)",
                color: isLoading ? "var(--text-muted)" : "#0C0A09",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: isLoading ? "none" : "0 0 20px rgba(245,158,11,0.3)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div
              className="absolute inset-0 flex items-center"
              style={{ color: "var(--border-subtle, #29221D)" }}
            >
              <div className="w-full border-t" style={{ borderColor: "var(--border-subtle, #29221D)" }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-xs font-medium uppercase tracking-wider"
                style={{
                  background: "var(--bg-card, rgba(28,25,23,0.85))",
                  color: "var(--text-muted, #78716C)",
                }}
              >
                or
              </span>
            </div>
          </div>

          {/* Guest button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGuest}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border"
            style={{
              background: "transparent",
              borderColor: "var(--border-subtle, #29221D)",
              color: "var(--text-secondary, #A8A29E)",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = "#F59E0B";
                e.currentTarget.style.color = "#FAFAF9";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle, #29221D)";
              e.currentTarget.style.color = "var(--text-secondary, #A8A29E)";
            }}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserCircle className="size-4" />
            )}
            Continue as Guest
          </button>
          <p
            className="text-center mt-2 text-xs"
            style={{ color: "var(--text-muted, #78716C)" }}
          >
            Guest sessions expire after 1 day
          </p>

          {/* Toggle mode */}
          <div
            className="mt-6 pt-6 text-center text-sm"
            style={{
              borderTop: "1px solid var(--border-subtle, #29221D)",
              color: "var(--text-secondary, #A8A29E)",
            }}
          >
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-bold transition-colors hover:underline"
                  style={{ color: "#F59E0B" }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-bold transition-colors hover:underline"
                  style={{ color: "#F59E0B" }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
