/**
 * Omega Swarm v5.1 — Automation / Autopilot Control Panel
 *
 * Lets the user configure the server-side scheduler:
 *   - Master on/off switch
 *   - Auto-publish vs review mode
 *   - Preferred posting days (Tue-Thu default per briefing)
 *   - Time window (9-11 AM default)
 *   - Target platforms
 *   - Manual triggers: generate drafts now, run publish tick now
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  Zap,
  Play,
  Send,
  Eye,
  Image,
  Globe,
  Share2,
  Loader2,
} from "lucide-react";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const PLATFORM_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  instagram: { label: "Instagram", icon: Image, color: "#EC4899" },
  facebook: { label: "Facebook", icon: Globe, color: "#3B82F6" },
  linkedin: { label: "LinkedIn", icon: Share2, color: "#0A66C2" },
};

export default function Automation() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.automation.getSettings.useQuery();
  const update = trpc.automation.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.automation.getSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const generateNow = trpc.automation.generateNow.useMutation({
    onSuccess: (r) => toast.success(`Generated ${r.generated} drafts`),
    onError: (e) => toast.error(e.message),
  });
  const runNow = trpc.automation.runNow.useMutation({
    onSuccess: (r) =>
      toast.success(`Checked ${r.checked}, published ${r.published}, drafted ${r.drafted}`),
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    enabled: false,
    autoPublish: false,
    preferredDays: ["tuesday", "wednesday", "thursday"] as string[],
    timeWindowStart: 9,
    timeWindowEnd: 11,
    timezone: "Europe/Amsterdam",
    platforms: ["instagram", "facebook", "linkedin"] as string[],
    brandVoice: "",
  });

  // Hydrate form when settings load
  if (settings && !update.isPending && form.enabled === false && settings.enabled) {
    setForm({
      enabled: settings.enabled,
      autoPublish: settings.autoPublish,
      preferredDays: (settings.preferredDays as string[]) ?? ["tuesday", "wednesday", "thursday"],
      timeWindowStart: settings.timeWindowStart,
      timeWindowEnd: settings.timeWindowEnd,
      timezone: settings.timezone,
      platforms: (settings.platforms as string[]) ?? ["instagram", "facebook", "linkedin"],
      brandVoice: settings.brandVoice ?? "",
    });
  }

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d) => d !== day)
        : [...prev.preferredDays, day],
    }));
  };

  const togglePlatform = (p: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const save = () => {
    if (form.timeWindowStart > form.timeWindowEnd) {
      toast.error("Start time must be before end time");
      return;
    }
    if (form.preferredDays.length === 0) {
      toast.error("Select at least one posting day");
      return;
    }
    if (form.platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    update.mutate({
      enabled: form.enabled,
      autoPublish: form.autoPublish,
      preferredDays: form.preferredDays as any,
      timeWindowStart: form.timeWindowStart,
      timeWindowEnd: form.timeWindowEnd,
      timezone: form.timezone,
      platforms: form.platforms as any,
      brandVoice: form.brandVoice,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin" style={{ color: "#8B949E" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Zap className="size-7" style={{ color: "#F59E0B" }} />
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Autopilot
        </h1>
      </div>

      {/* Master switch */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Automation
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Let the app generate drafts and post them on your schedule
            </p>
          </div>
          <button
            onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
            className="transition-transform active:scale-95"
          >
            {form.enabled ? (
              <ToggleRight className="size-10" style={{ color: "#10B981" }} />
            ) : (
              <ToggleLeft className="size-10" style={{ color: "#6B7280" }} />
            )}
          </button>
        </div>

        {!form.enabled && (
          <p className="text-sm rounded-lg p-3" style={{ background: "#EF444415", color: "#FCA5A5" }}>
            Autopilot is off. Turn it on to start generating drafts and publishing on schedule.
          </p>
        )}
      </div>

      {/* Publish mode */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Publish mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setForm((p) => ({ ...p, autoPublish: false }))}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: !form.autoPublish ? "#3B82F615" : "var(--bg-elevated)",
              border: `1px solid ${!form.autoPublish ? "#3B82F660" : "var(--border-subtle)"}`,
            }}
          >
            <Eye className="size-5" style={{ color: "#3B82F6" }} />
            <div>
              <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                Review first
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Drafts appear in Content Library for your approval
              </div>
            </div>
          </button>
          <button
            onClick={() => setForm((p) => ({ ...p, autoPublish: true }))}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: form.autoPublish ? "#10B98115" : "var(--bg-elevated)",
              border: `1px solid ${form.autoPublish ? "#10B98160" : "var(--border-subtle)"}`,
            }}
          >
            <Send className="size-5" style={{ color: "#10B981" }} />
            <div>
              <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                Auto-publish
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Posts go live automatically within your time window
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Schedule */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="size-5" style={{ color: "var(--text-muted)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Schedule
          </h2>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-primary)" }}>
            Posting days
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DAY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleDay(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: form.preferredDays.includes(key) ? "#8B5CF620" : "var(--bg-elevated)",
                  color: form.preferredDays.includes(key) ? "#A78BFA" : "var(--text-muted)",
                  border: `1px solid ${form.preferredDays.includes(key) ? "#8B5CF640" : "var(--border-subtle)"}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-primary)" }}>
              From (hour)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={form.timeWindowStart}
              onChange={(e) => setForm((p) => ({ ...p, timeWindowStart: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-primary)" }}>
              To (hour)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={form.timeWindowEnd}
              onChange={(e) => setForm((p) => ({ ...p, timeWindowEnd: parseInt(e.target.value) || 23 }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-primary)" }}>
            Timezone
          </label>
          <input
            type="text"
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Platforms */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Platforms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = form.platforms.includes(key);
            return (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: active ? cfg.color + "15" : "var(--bg-elevated)",
                  border: `1px solid ${active ? cfg.color + "50" : "var(--border-subtle)"}`,
                }}
              >
                <Icon className="size-5" style={{ color: active ? cfg.color : "var(--text-muted)" }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand voice */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Voice override
        </h2>
        <input
          type="text"
          placeholder="Optional brand voice tag (leave empty to use Memory Bank)"
          value={form.brandVoice}
          onChange={(e) => setForm((p) => ({ ...p, brandVoice: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
        />
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={update.isPending}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all"
        style={{ background: "#8B5CF6", color: "#fff" }}
      >
        {update.isPending ? "Saving…" : "Save settings"}
      </button>

      {/* Manual triggers */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Manual triggers
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generateNow.mutate()}
            disabled={generateNow.isPending || !form.enabled}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: generateNow.isPending ? "#6B7280" : "#8B5CF6",
              color: "#fff",
              opacity: !form.enabled ? 0.5 : 1,
            }}
          >
            {generateNow.isPending ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
            Generate next week
          </button>
          <button
            onClick={() => runNow.mutate()}
            disabled={runNow.isPending || !form.enabled}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: runNow.isPending ? "#6B7280" : "#10B981",
              color: "#fff",
              opacity: !form.enabled ? 0.5 : 1,
            }}
          >
            {runNow.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run publish tick
          </button>
        </div>
        {settings?.lastRunAt && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last scheduler run: {new Date(settings.lastRunAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
