import { useState, useRef, type ChangeEvent } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Zap,
  Save,
  CheckCircle,
  Check,
  Upload,
  Image,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Settings() {
  const {
    themeId,
    setTheme,
    customAccent,
    setCustomAccent,
    brandName,
    setBrandName,
    logo,
    setLogo,
    favicon,
    setFavicon,
    primaryColor,
    presets,
  } = useTheme();

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [name, setName] = useState("Isaac Bullock Kintu");
  const [email, setEmail] = useState("isaac@wildnoff.com");
  const [company, setCompany] = useState("Wildnoff Collective");
  const [role, setRole] = useState("Founder & Creative Director");

  // Notifications state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [agentUpdates, setAgentUpdates] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Appearance state (from context)
  const [localBrandName, setLocalBrandName] = useState(brandName);
  const [localAccent, setLocalAccent] = useState(customAccent ?? primaryColor);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Sync brand name
    if (localBrandName !== brandName) {
      setBrandName(localBrandName);
    }
    // Sync accent
    if (localAccent !== customAccent) {
      setCustomAccent(localAccent);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFavicon(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
  ];

  /* ── Theme gallery data ── */
  const themeIds = Object.keys(presets);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Manage your account, preferences, and Swarm configuration
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: saved
                ? "var(--accent-success)"
                : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "var(--bg-base)",
              boxShadow: saved
                ? "0 0 20px rgba(132,204,22,0.3)"
                : "0 0 20px rgba(245,158,11,0.3)",
            }}
          >
            {saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-56 shrink-0 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: isActive
                      ? "rgba(245, 158, 11, 0.1)"
                      : "transparent",
                    borderLeft: isActive
                      ? "3px solid var(--accent-primary)"
                      : "3px solid transparent",
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{
                      color: isActive
                        ? "var(--accent-primary)"
                        : "var(--text-muted)",
                    }}
                  />
                  {tab.label}
                </button>
              );
            })}

            {/* Plan info */}
            <div
              className="mt-6 p-4 rounded-2xl"
              style={{
                background: "rgba(245, 158, 11, 0.05)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap
                  className="w-4 h-4"
                  style={{ color: "var(--accent-primary)" }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Pro Plan
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                12 agents, unlimited campaigns, full analytics
              </p>
              <button
                className="mt-3 w-full py-2 rounded-lg text-xs font-bold transition-colors"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-base)",
                }}
              >
                Upgrade
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h2 className="text-lg font-bold mb-6">
                  Profile Information
                </h2>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{
                        background: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{
                        background: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{
                        background: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Role
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{
                        background: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h2 className="text-lg font-bold mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: "Email Notifications",
                      desc: "Receive email updates about your campaigns",
                      state: emailNotifs,
                      set: setEmailNotifs,
                    },
                    {
                      label: "Campaign Alerts",
                      desc: "Get notified when campaigns start or complete",
                      state: campaignAlerts,
                      set: setCampaignAlerts,
                    },
                    {
                      label: "Agent Status Updates",
                      desc: "Real-time alerts when agents go online/offline",
                      state: agentUpdates,
                      set: setAgentUpdates,
                    },
                    {
                      label: "Weekly Performance Report",
                      desc: "Summary of your Swarm's weekly activity",
                      state: weeklyReport,
                      set: setWeeklyReport,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => item.set(!item.state)}
                        className="w-12 h-7 rounded-full transition-all relative"
                        style={{
                          background: item.state
                            ? "var(--accent-primary)"
                            : "var(--border)",
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-6 h-6 rounded-full transition-all"
                          style={{
                            background: "var(--text-primary)",
                            left: item.state
                              ? "calc(100% - 26px)"
                              : "2px",
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── APPEARANCE TAB ── */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                {/* Theme Gallery */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h2 className="text-lg font-bold mb-2">Theme</h2>
                  <p
                    className="text-sm mb-6"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Choose a color palette that matches your brand.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {themeIds.map((id) => {
                      const t = presets[id];
                      const isActive = themeId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setTheme(id)}
                          className="relative rounded-xl p-4 text-left transition-all border-2"
                          style={{
                            background: t.void,
                            borderColor: isActive
                              ? primaryColor
                              : t.border,
                            boxShadow: isActive
                              ? `0 0 20px ${primaryColor}33`
                              : "none",
                          }}
                        >
                          {/* Checkmark */}
                          {isActive && (
                            <div
                              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: primaryColor }}
                            >
                              <Check
                                className="w-3 h-3"
                                style={{ color: t.void }}
                              />
                            </div>
                          )}
                          {/* Mini preview */}
                          <div className="flex gap-2 mb-3">
                            {t.particleColors.map((c, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full"
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: t.cream }}
                          >
                            {t.name}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: t.creamMuted }}
                          >
                            {id.charAt(0).toUpperCase() + id.slice(1)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Accent */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h2 className="text-lg font-bold mb-2">
                    Custom Accent Color
                  </h2>
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Override the primary accent color for any theme.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="color"
                        value={localAccent}
                        onChange={(e) => {
                          setLocalAccent(e.target.value);
                          setCustomAccent(e.target.value);
                        }}
                        className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                        style={{ background: "transparent" }}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={localAccent}
                        onChange={(e) => {
                          setLocalAccent(e.target.value);
                          setCustomAccent(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-mono transition-colors"
                        style={{
                          background: "var(--input)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setLocalAccent(presets[themeId].primary);
                        setCustomAccent(null);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                      style={{
                        background: "var(--input)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Branding */}
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h2 className="text-lg font-bold mb-2">Branding</h2>
                  <p
                    className="text-sm mb-6"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Customize how your Swarm appears in the sidebar.
                  </p>

                  {/* Brand Name */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={localBrandName}
                      onChange={(e) => {
                        setLocalBrandName(e.target.value);
                        setBrandName(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{
                        background: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Logo
                    </label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      {logo && (
                        <img
                          src={logo}
                          alt="Logo preview"
                          className="w-12 h-12 rounded-lg object-cover"
                          style={{
                            border: "1px solid var(--border)",
                          }}
                        />
                      )}
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          background: "var(--input)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        {logo ? "Change Logo" : "Upload Logo"}
                      </button>
                      {logo && (
                        <button
                          onClick={() => setLogo(null)}
                          className="text-xs transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Favicon
                    </label>
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      {favicon && (
                        <img
                          src={favicon}
                          alt="Favicon preview"
                          className="w-8 h-8 rounded object-cover"
                          style={{
                            border: "1px solid var(--border)",
                          }}
                        />
                      )}
                      <button
                        onClick={() => faviconInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          background: "var(--input)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <Image className="w-4 h-4" />
                        {favicon ? "Change Favicon" : "Upload Favicon"}
                      </button>
                      {favicon && (
                        <button
                          onClick={() => setFavicon(null)}
                          className="text-xs transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BILLING TAB ── */}
            {activeTab === "billing" && (
              <div className="space-y-4">
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h2 className="text-lg font-bold mb-4">Current Plan</h2>
                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      background: "rgba(245, 158, 11, 0.05)",
                      border: "1px solid rgba(245, 158, 11, 0.15)",
                    }}
                  >
                    <div>
                      <p
                        className="font-bold"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        Pro Plan
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        €299/month — billed monthly
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: "rgba(132,204,22,0.1)",
                        color: "var(--accent-success)",
                      }}
                    >
                      Active
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      { label: "Agents", value: "12 / 12", used: true },
                      { label: "Campaigns", value: "Unlimited", used: false },
                      { label: "API Calls", value: "50K / mo", used: true },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-3 rounded-xl text-center"
                        style={{ background: "var(--input)" }}
                      >
                        <p className="text-lg font-bold">{item.value}</p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h2 className="text-lg font-bold mb-4">Payment Method</h2>
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: "var(--input)" }}
                  >
                    <div
                      className="w-10 h-7 rounded flex items-center justify-center text-xs font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                        color: "var(--bg-base)",
                      }}
                    >
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">
                        •••• •••• •••• 4242
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Expires 12/26
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h2 className="text-lg font-bold mb-6">Security</h2>
                <div className="space-y-4">
                  <div
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div>
                      <p className="font-medium">
                        Two-Factor Authentication
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Add an extra layer of security
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        background: "var(--accent-primary)",
                        color: "var(--bg-base)",
                      }}
                    >
                      Enable
                    </button>
                  </div>
                  <div
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div>
                      <p className="font-medium">API Keys</p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Manage your OpenAI and Buffer API keys
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        background: "var(--accent-primary)",
                        color: "var(--bg-base)",
                      }}
                    >
                      Manage
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-red-400">
                        Danger Zone
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Delete account and all data
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
