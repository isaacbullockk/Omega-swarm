import { useState } from "react";
import {
  Brain,
  Sparkles,
  Lightbulb,
  Clock,
  Megaphone,
  Pencil,
} from "lucide-react";

/* ───────── Main Component ───────── */
export default function MemoryBank() {
  const [historyTab, setHistoryTab] = useState<"wins" | "losses">("wins");

  return (
    <div className="min-h-[100dvh] p-6 lg:p-8" style={{ fontFamily: "var(--font-primary)" }}>
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* ═══ Page Header ═══ */}
        <div className="animate-fade-up" style={{ animationDelay: "0s", opacity: 0 }}>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.25)" }}
            >
              <Brain className="w-6 h-6" style={{ color: "#A855F7" }} />
            </div>
            <div>
              <h1 className="text-[2.25rem] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Brain AI
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Memory Bank — Swarm intelligence & learned patterns
              </p>
            </div>
          </div>
          <div className="mt-4 h-px w-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* ═══════════════════════════════════════════
            TOP SECTION: Memory Clusters + Stats
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Memory Clusters */}
          <div
            className="animate-fade-up rounded-2xl flex flex-col items-center justify-center text-center"
            style={{
              animationDelay: "0.08s",
              opacity: 0,
              background: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              minHeight: "360px",
              padding: "40px",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)" }}
            >
              <Brain className="w-8 h-8" style={{ color: "#A855F7", opacity: 0.5 }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              No memory clusters yet
            </h3>
            <p className="text-sm mt-1.5 max-w-sm" style={{ color: "var(--text-secondary)" }}>
              Deploy campaigns to build institutional knowledge.
            </p>
          </div>

          {/* Stats Panel */}
          <div
            className="animate-fade-up space-y-4"
            style={{ animationDelay: "0.16s", opacity: 0 }}
          >
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex flex-col items-center justify-center text-center py-10">
                <Brain className="w-8 h-8 mb-3" style={{ color: "#A855F7", opacity: 0.35 }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Campaign analytics will appear here once data is available.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            BOTTOM SECTION: Memory Entries + Timeline + Brand Voice
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learned Patterns */}
          <div
            className="lg:col-span-2 animate-fade-up"
            style={{
              animationDelay: "0.24s",
              opacity: 0,
              background: "var(--gradient-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "24px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Learned Patterns</h2>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "var(--accent-primary)" }}>
                0 entries
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-16">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <Lightbulb className="w-7 h-7" style={{ color: "#F59E0B", opacity: 0.5 }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                No research entries yet.
              </p>
            </div>
          </div>

          {/* Right Column: Timeline + Brand Voice */}
          <div className="space-y-6">
            {/* Campaign History Timeline */}
            <div
              className="animate-fade-up"
              style={{
                animationDelay: "0.32s",
                opacity: 0,
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px",
                backdropFilter: "blur(12px)",
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Campaign History</h2>

              {/* Tab toggle */}
              <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "var(--bg-input)" }}>
                <button
                  onClick={() => setHistoryTab("wins")}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: historyTab === "wins" ? "rgba(34,197,94,0.15)" : "transparent",
                    color: historyTab === "wins" ? "#22C55E" : "var(--text-muted)",
                  }}
                >
                  Wins
                </button>
                <button
                  onClick={() => setHistoryTab("losses")}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: historyTab === "losses" ? "rgba(239,68,68,0.15)" : "transparent",
                    color: historyTab === "losses" ? "#EF4444" : "var(--text-muted)",
                  }}
                >
                  Losses
                </button>
              </div>

              {/* Empty state */}
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
                >
                  <Clock className="w-6 h-6" style={{ color: "#A855F7", opacity: 0.5 }} />
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No events recorded yet.
                </p>
              </div>
            </div>

            {/* Brand Voice Panel */}
            <div
              className="animate-fade-up"
              style={{
                animationDelay: "0.4s",
                opacity: 0,
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Brand Voice</h2>
                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Empty state */}
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <Megaphone className="w-6 h-6" style={{ color: "#F59E0B", opacity: 0.5 }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  No brand voice metrics yet.
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Create a brand voice to see analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
