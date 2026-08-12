import { useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }
    setIsLoading(true);
    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    toast.success("Welcome back to Omega Swarm!");
    navigate("/");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--bg-base, #0C0A09)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4 flex size-16 items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{
                background:
                  "linear-gradient(135deg, #F59E0B, #F97316)",
              }}
            />
            <div
              className="relative flex size-16 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #F59E0B, #F97316)",
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

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "var(--bg-card, rgba(28,25,23,0.85))",
            border: "1px solid var(--border-subtle, #29221D)",
            backdropFilter: "blur(20px)",
          }}
        >
          <h2
            className="text-lg font-bold mb-6"
            style={{ color: "var(--text-primary, #FAFAF9)" }}
          >
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted, #78716C)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: "var(--bg-elevated, #29221D)",
                  border: "1px solid var(--border-subtle, #29221D)",
                  color: "var(--text-primary, #FAFAF9)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#F59E0B")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor =
                    "var(--border-subtle, #29221D)")
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted, #78716C)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: "var(--bg-elevated, #29221D)",
                  border: "1px solid var(--border-subtle, #29221D)",
                  color: "var(--text-primary, #FAFAF9)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#F59E0B")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor =
                    "var(--border-subtle, #29221D)")
                }
              />
            </div>

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
                boxShadow: isLoading
                  ? "none"
                  : "0 0 20px rgba(245,158,11,0.3)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Sign In
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div
            className="mt-6 pt-6 text-center text-xs"
            style={{
              color: "var(--text-muted, #78716C)",
              borderTop: "1px solid var(--border-subtle, #29221D)",
            }}
          >
            Demo credentials: any email / any password
          </div>
        </div>
      </div>
    </div>
  );
}
