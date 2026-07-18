import { useState } from "react";
import { User, Bell, Shield, Palette, CreditCard, Zap, Save, CheckCircle } from "lucide-react";

export default function Settings() {
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

  // Appearance state
  const [theme, setTheme] = useState("dark");
  const [particleDensity, setParticleDensity] = useState(50);
  const [animations, setAnimations] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Manage your account, preferences, and Swarm configuration
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: saved ? "#22C55E" : "linear-gradient(135deg, #F59E0B, #F97316)",
              color: "#0C0A09",
              boxShadow: saved ? "0 0 20px rgba(34,197,94,0.3)" : "0 0 20px rgba(245,158,11,0.3)",
            }}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
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
                    background: isActive ? "rgba(245, 158, 11, 0.1)" : "transparent",
                    borderLeft: isActive ? "3px solid #F59E0B" : "3px solid transparent",
                    color: isActive ? "#FAF5EF" : "var(--text-secondary)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? "#F59E0B" : "var(--text-muted)" }} />
                  {tab.label}
                </button>
              );
            })}

            {/* Plan info */}
            <div className="mt-6 p-4 rounded-2xl" style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">Pro Plan</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                12 agents, unlimited campaigns, full analytics
              </p>
              <button className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors">
                Upgrade
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
                <h2 className="text-lg font-bold mb-6">Profile Information</h2>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Company</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Role</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-colors"
                      style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
                <h2 className="text-lg font-bold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: "Email Notifications", desc: "Receive email updates about your campaigns", state: emailNotifs, set: setEmailNotifs },
                    { label: "Campaign Alerts", desc: "Get notified when campaigns start or complete", state: campaignAlerts, set: setCampaignAlerts },
                    { label: "Agent Status Updates", desc: "Real-time alerts when agents go online/offline", state: agentUpdates, set: setAgentUpdates },
                    { label: "Weekly Performance Report", desc: "Summary of your Swarm's weekly activity", state: weeklyReport, set: setWeeklyReport },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.set(!item.state)}
                        className="w-12 h-7 rounded-full transition-all relative"
                        style={{ background: item.state ? "#F59E0B" : "var(--border)" }}
                      >
                        <div
                          className="absolute top-0.5 w-6 h-6 rounded-full transition-all"
                          style={{
                            background: "#FAF5EF",
                            left: item.state ? "calc(100% - 26px)" : "2px",
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
                <h2 className="text-lg font-bold mb-6">Appearance</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Theme</label>
                    <div className="flex gap-3">
                      {[
                        { id: "dark", label: "Dark", bg: "#0C0A09" },
                        { id: "light", label: "Light", bg: "#FAF5EF" },
                        { id: "auto", label: "Auto", bg: "linear-gradient(135deg, #0C0A09 50%, #FAF5EF 50%)" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                          style={{
                            border: theme === t.id ? "2px solid #F59E0B" : "2px solid var(--border)",
                            background: "var(--input)",
                          }}
                        >
                          <div className="w-6 h-6 rounded-full" style={{ background: t.bg }} />
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                      Particle Density: {particleDensity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={particleDensity}
                      onChange={(e) => setParticleDensity(Number(e.target.value))}
                      className="w-full max-w-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Animations</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Enable page transitions and particle effects</p>
                    </div>
                    <button
                      onClick={() => setAnimations(!animations)}
                      className="w-12 h-7 rounded-full transition-all relative"
                      style={{ background: animations ? "#F59E0B" : "var(--border)" }}
                    >
                      <div
                        className="absolute top-0.5 w-6 h-6 rounded-full transition-all"
                        style={{ background: "#FAF5EF", left: animations ? "calc(100% - 26px)" : "2px" }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-4">
                <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
                  <h2 className="text-lg font-bold mb-4">Current Plan</h2>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                    <div>
                      <p className="font-bold text-[#F59E0B]">Pro Plan</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>€299/month — billed monthly</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#22C55E]/10 text-[#22C55E]">Active</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      { label: "Agents", value: "12 / 12", used: true },
                      { label: "Campaigns", value: "Unlimited", used: false },
                      { label: "API Calls", value: "50K / mo", used: true },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: "var(--input)" }}>
                        <p className="text-lg font-bold">{item.value}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
                  <h2 className="text-lg font-bold mb-4">Payment Method</h2>
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--input)" }}>
                    <div className="w-10 h-7 rounded bg-gradient-to-r from-[#F59E0B] to-[#F97316] flex items-center justify-center text-xs font-bold text-black">VISA</div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Expires 12/26</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
                <h2 className="text-lg font-bold mb-6">Security</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-xs font-bold bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p className="font-medium">API Keys</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your OpenAI and Buffer API keys</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-xs font-bold bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors">
                      Manage
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-red-400">Danger Zone</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Delete account and all data</p>
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
