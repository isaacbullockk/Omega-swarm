import { useState, useCallback } from "react";
import {
  Bell,
  Globe,
  Shield,
  Zap,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  Info,
  Save,
  Sliders,
  Fingerprint,
  Braces,
  Webhook,
} from "lucide-react";

/* ─────────────────────────── Sub-components ─────────────────────────── */

function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  icon: Icon,
  badge,
  danger = false,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ElementType;
  badge?: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
      {Icon && (
        <div
          className="size-10 flex items-center justify-center rounded-lg shrink-0"
          style={{ background: danger ? "rgba(239,68,68,0.1)" : "var(--bg-card-solid)" }}
        >
          <Icon className="size-5" style={{ color: danger ? "#EF4444" : "var(--accent-primary)" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="text-sm font-medium cursor-pointer" style={{ color: "var(--text-primary)" }}>
            {label}
          </label>
          {badge && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          background: checked ? "var(--accent-primary)" : "var(--bg-card-solid)",
          border: "1px solid var(--border-subtle)",
          focusRing: "var(--accent-primary)",
        }}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-transform duration-200"
          style={{
            background: "#fff",
            left: checked ? "calc(100% - 1.25rem)" : "0.25rem",
          }}
        />
      </button>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="size-10 flex items-center justify-center rounded-xl" style={{ background: "var(--accent-primary)" }}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        {description && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  description,
  icon: Icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  description?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-4" style={{ color: "var(--text-muted)" }} />}
        <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </label>
      </div>
      {description && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{description}</p>}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none rotate-90" style={{ color: "var(--text-muted)" }} />
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
  icon: Icon,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  description?: string;
  icon?: React.ElementType;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-4" style={{ color: "var(--text-muted)" }} />}
        <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </label>
      </div>
      {description && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{description}</p>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function Settings() {
  const [activeSection, setActiveSection] = useState<"general" | "agents" | "api" | "data">("general");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── General ── */
  const [autoLaunch, setAutoLaunch] = useState(true);
  const [autoCreate, setAutoCreate] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");

  /* ── Agents ── */
  const [parallelAgents, setParallelAgents] = useState(5);
  const [maxRetries, setMaxRetries] = useState(3);
  const [timeout, setTimeout] = useState(30);
  const [debugMode, setDebugMode] = useState(false);
  const [saveMemory, setSaveMemory] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  /* ── API ── */
  const [apiKey, setApiKey] = useState("sk-...omega-swarm-2024");
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.example.com/omega-swarm");
  const [rateLimit, setRateLimit] = useState(100);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = useCallback(() => {
    setSaving(true);
    setSaveMessage(null);
    setTimeout(() => {
      setSaving(false);
      setSaveMessage({ type: "success", text: "Settings saved successfully" });
      setTimeout(() => setSaveMessage(null), 3000);
    }, 800);
  }, []);

  const sections: { id: typeof activeSection; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "General", icon: Sliders },
    { id: "agents", label: "AI Agents", icon: Zap },
    { id: "api", label: "API & Integrations", icon: Webhook },
    { id: "data", label: "Data & Privacy", icon: Shield },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Settings
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Configure your Omega Swarm workspace
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              color: "#0C0A09",
            }}
          >
            {saving ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Save status */}
        {saveMessage && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            role="alert"
            aria-live="polite"
            style={{
              background: saveMessage.type === "success" ? "#22C55E11" : "#EF444411",
              border: `1px solid ${saveMessage.type === "success" ? "#22C55E44" : "#EF444444"}`,
              color: saveMessage.type === "success" ? "#22C55E" : "#EF4444",
            }}
          >
            {saveMessage.type === "success" ? (
              <CheckCircle className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {saveMessage.text}
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
          {sections.map((s) => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "var(--accent-primary)" : "transparent",
                  color: active ? "#fff" : "var(--text-muted)",
                }}
                role="tab"
                aria-selected={active}
                aria-controls={`settings-panel-${s.id}`}
              >
                <Icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ═════════════════════ GENERAL ═════════════════════ */}
        {activeSection === "general" && (
          <div id="settings-panel-general" className="space-y-6">
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
            >
              <SectionHeader icon={Sliders} title="General Preferences" description="Workspace behavior and appearance" />

              <div className="space-y-3">
                <ToggleSwitch
                  id="auto-launch"
                  label="Auto-launch Campaigns"
                  description="Automatically start campaigns when all content is ready"
                  checked={autoLaunch}
                  onChange={setAutoLaunch}
                  icon={Zap}
                  badge="Recommended"
                />
                <ToggleSwitch
                  id="auto-create"
                  label="Auto-create Content"
                  description="Automatically create content when campaigns are launched"
                  checked={autoCreate}
                  onChange={setAutoCreate}
                  icon={Zap}
                />
                <ToggleSwitch
                  id="notifications"
                  label="Push Notifications"
                  description="Receive notifications about campaign progress and agent actions"
                  checked={notifications}
                  onChange={setNotifications}
                  icon={Bell}
                />
              </div>

              <div className="h-px" style={{ background: "var(--border-subtle)" }} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField
                  id="theme-select"
                  label="Theme"
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: "dark", label: "Dark" },
                    { value: "light", label: "Light" },
                    { value: "system", label: "System" },
                  ]}
                  description="Choose your preferred color scheme"
                  icon={theme === "dark" ? Moon : theme === "light" ? Sun : Monitor}
                />
                <SelectField
                  id="language-select"
                  label="Language"
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: "en", label: "English" },
                    { value: "es", label: "Spanish" },
                    { value: "fr", label: "French" },
                    { value: "de", label: "German" },
                    { value: "zh", label: "Chinese" },
                    { value: "ja", label: "Japanese" },
                  ]}
                  description="Interface language"
                  icon={Globe}
                />
                <SelectField
                  id="timezone-select"
                  label="Timezone"
                  value={timezone}
                  onChange={setTimezone}
                  options={[
                    { value: "UTC", label: "UTC" },
                    { value: "America/New_York", label: "Eastern Time" },
                    { value: "America/Los_Angeles", label: "Pacific Time" },
                    { value: "Europe/London", label: "London" },
                    { value: "Europe/Paris", label: "Paris" },
                    { value: "Asia/Tokyo", label: "Tokyo" },
                    { value: "Asia/Shanghai", label: "Shanghai" },
                  ]}
                  description="Timezone for scheduling"
                  icon={Globe}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════ AI AGENTS ═════════════════════ */}
        {activeSection === "agents" && (
          <div id="settings-panel-agents" className="space-y-6">
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
            >
              <SectionHeader icon={Zap} title="AI Agent Configuration" description="Behavior and performance tuning" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  id="parallel-agents"
                  label="Parallel Agents"
                  type="number"
                  value={String(parallelAgents)}
                  onChange={(v) => setParallelAgents(Number(v))}
                  description="Number of agents to run simultaneously (1-10)"
                  icon={Zap}
                />
                <InputField
                  id="max-retries"
                  label="Max Retries"
                  type="number"
                  value={String(maxRetries)}
                  onChange={(v) => setMaxRetries(Number(v))}
                  description="Retry attempts for failed actions (0-10)"
                  icon={RefreshCw}
                />
                <InputField
                  id="timeout"
                  label="Timeout (seconds)"
                  type="number"
                  value={String(timeout)}
                  onChange={(v) => setTimeout(Number(v))}
                  description="Maximum wait time for agent actions (10-300)"
                  icon={Server}
                />
              </div>

              <div className="h-px" style={{ background: "var(--border-subtle)" }} />

              <div className="space-y-3">
                <ToggleSwitch
                  id="debug-mode"
                  label="Debug Mode"
                  description="Show detailed agent logs and reasoning in the UI"
                  checked={debugMode}
                  onChange={setDebugMode}
                  icon={Server}
                />
                <ToggleSwitch
                  id="save-memory"
                  label="Save to Memory Bank"
                  description="Store agent learnings and insights in the memory bank"
                  checked={saveMemory}
                  onChange={setSaveMemory}
                  icon={Zap}
                  badge="Recommended"
                />
                <ToggleSwitch
                  id="strict-mode"
                  label="Strict Mode"
                  description="Require explicit approval for all agent actions"
                  checked={strictMode}
                  onChange={setStrictMode}
                  icon={Shield}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════ API ═════════════════════ */}
        {activeSection === "api" && (
          <div id="settings-panel-api" className="space-y-6">
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
            >
              <SectionHeader icon={Webhook} title="API Configuration" description="Integrate with external services" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="size-4" style={{ color: "var(--text-muted)" }} />
                    <label htmlFor="api-key" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      API Key
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Your API key for external integrations. Keep this secret.
                  </p>
                </div>

                <InputField
                  id="webhook-url"
                  label="Webhook URL"
                  value={webhookUrl}
                  onChange={setWebhookUrl}
                  placeholder="https://hooks.example.com/omega-swarm"
                  description="Receive real-time updates about agent actions and campaign events"
                  icon={Webhook}
                />

                <InputField
                  id="rate-limit"
                  label="Rate Limit (requests/min)"
                  type="number"
                  value={String(rateLimit)}
                  onChange={(v) => setRateLimit(Number(v))}
                  description="Maximum API requests per minute (10-1000)"
                  icon={Server}
                />
              </div>

              <div className="h-px" style={{ background: "var(--border-subtle)" }} />

              <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex items-center gap-2">
                  <Braces className="size-4" style={{ color: "var(--accent-primary)" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    API Documentation
                  </h3>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Access the full API documentation to integrate Omega Swarm with your existing tools.
                </p>
                <button
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--accent-primary)" }}
                >
                  View Documentation
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════ DATA ═════════════════════ */}
        {activeSection === "data" && (
          <div id="settings-panel-data" className="space-y-6">
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
            >
              <SectionHeader icon={Shield} title="Data & Privacy" description="Manage your data and privacy settings" />

              <div className="space-y-3">
                <div
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="size-10 flex items-center justify-center rounded-lg" style={{ background: "var(--bg-card-solid)" }}>
                    <Download className="size-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Export Data
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Download all your campaigns, content, and settings as JSON
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ background: "var(--bg-card-solid)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                  >
                    Export
                  </button>
                </div>

                <div
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="size-10 flex items-center justify-center rounded-lg" style={{ background: "var(--bg-card-solid)" }}>
                    <Upload className="size-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Import Data
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Import campaigns, content, and settings from a JSON file
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ background: "var(--bg-card-solid)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                  >
                    Import
                  </button>
                </div>

                <div
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="size-10 flex items-center justify-center rounded-lg" style={{ background: "#EF444411" }}>
                    <Trash2 className="size-5" style={{ color: "#EF4444" }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Clear All Data
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Permanently delete all campaigns, content, and settings. This cannot be undone.
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/10"
                    style={{ background: "#EF444411", color: "#EF4444", border: "1px solid #EF444422" }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="h-px" style={{ background: "var(--border-subtle)" }} />

              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.08)" }}>
                <Info className="size-5 shrink-0 mt-0.5" style={{ color: "var(--accent-primary)" }} />
                <div>
                  <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Data Privacy
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Your data is stored locally in your browser and on your server. We do not send your content to third-party services except for AI generation, which uses your configured API keys. All API calls are made directly from your server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
