import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  Globe,
  Music,
  Palette,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Mic,
  Users,
  Sparkles,
  Hash,
  Type,
  Image,
  Video,
  FileText,
  Radio,
} from "lucide-react";

export default function Projects() {
  const { data: clients, isLoading } = trpc.client.list.useQuery();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "brand" | "content" | "calendar">("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-64 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    );
  }

  const client = clients?.[0];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Projects
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Manage client brands, content calendars, and campaigns
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <Briefcase className="size-4" />
            {clients?.length ?? 0} active
          </div>
        </div>

        {/* Client Cards */}
        {clients?.map((c) => {
          const isExpanded = expandedClient === c.id;
          return (
            <div
              key={c.id}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "var(--bg-card-solid)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedClient(isExpanded ? null : c.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className="size-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                  style={{
                    background: c.primaryColor,
                    color: "#fff",
                  }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {c.name}
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        background: c.status === "active" ? "#22C55E22" : "#F59E0B22",
                        color: c.status === "active" ? "#22C55E" : "#F59E0B",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                    {c.handle} · {c.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Palette className="size-3.5" />
                    {c.primaryColor}
                  </div>
                  {isExpanded ? <ChevronUp className="size-5" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="size-5" style={{ color: "var(--text-muted)" }} />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  {/* Tabs */}
                  <div className="flex gap-1 p-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    {(["overview", "brand", "content", "calendar"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                        style={{
                          background: activeTab === tab ? "var(--accent-primary)" : "transparent",
                          color: activeTab === tab ? "#fff" : "var(--text-muted)",
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 space-y-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <StatCard icon={<Users className="size-4" />} label="Tier" value={`${c.tier} (Hub)`} color="#8B5CF6" />
                          <StatCard icon={<MapPin className="size-4" />} label="Location" value={c.location} color="#22C55E" />
                          <StatCard icon={<BookOpen className="size-4" />} label="Stories" value={`${c.storyBank?.length ?? 0}`} color="#F59E0B" />
                          <StatCard icon={<Calendar className="size-4" />} label="Calendar" value={`${c.calendarEntries?.length ?? 0} entries`} color="#3B82F6" />
                        </div>

                        {/* Bios */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                            Canonical Bios
                          </h3>
                          <BioCard label="Full" text={c.bioFull} />
                          <BioCard label="Medium" text={c.bioMedium} />
                          <BioCard label="Short" text={c.bioShort} />
                        </div>

                        {/* Social Links */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Social Links
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(c.socialLinks ?? {}).map(([platform, url]) => (
                              <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                                style={{
                                  background: "var(--bg-elevated)",
                                  color: "var(--text-secondary)",
                                  border: "1px solid var(--border-subtle)",
                                }}
                              >
                                {platform === "instagram" && <Image className="size-3.5" />}
                                {platform === "twitter" && <Type className="size-3.5" />}
                                {platform === "linkedin" && <FileText className="size-3.5" />}
                                {platform === "youtube" && <Video className="size-3.5" />}
                                {platform === "tiktok" && <Music className="size-3.5" />}
                                {platform === "spotify" && <Radio className="size-3.5" />}
                                {platform === "tiktok" && <Music className="size-3.5" />}
                                {platform === "spotify" && <Music className="size-3.5" />}
                                {platform}
                                <ExternalLink className="size-3" />
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Website */}
                        {c.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="size-4" style={{ color: "var(--text-muted)" }} />
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                              style={{ color: "var(--accent-primary)" }}
                            >
                              {c.website}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BRAND TAB */}
                    {activeTab === "brand" && (
                      <div className="space-y-6">
                        {/* Colors */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Brand Colors
                          </h3>
                          <div className="flex gap-3">
                            <ColorSwatch color={c.primaryColor} label="Primary" />
                            <ColorSwatch color={c.secondaryColor} label="Secondary" />
                            <ColorSwatch color={c.accentColor} label="Accent" />
                          </div>
                        </div>

                        {/* Brand Hierarchy */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Brand Hierarchy
                          </h3>
                          <div className="space-y-2">
                            {c.brandHierarchy?.map((item: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: "var(--bg-elevated)" }}
                              >
                                <div
                                  className="size-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                  style={{
                                    background: item.tier === 1 ? "#D97706" : item.tier === 2 ? "#1E3A5F" : "#6B7280",
                                    color: "#fff",
                                  }}
                                >
                                  T{item.tier}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    {item.brand}
                                  </p>
                                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                    {item.role}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                                    {item.handle}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Naming Rules */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Naming Rules
                          </h3>
                          <div className="space-y-2">
                            {Object.entries(c.namingRules ?? {}).map(([key, rule]: [string, any]) => (
                              <div
                                key={key}
                                className="p-3 rounded-xl space-y-1"
                                style={{ background: "var(--bg-elevated)" }}
                              >
                                <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                                  {key}
                                </p>
                                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{rule.rule}</p>
                                <div className="flex gap-4 text-xs">
                                  <span style={{ color: "#EF4444" }}>Wrong: {rule.wrong}</span>
                                  <span style={{ color: "#22C55E" }}>Right: {rule.right}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tone & Banned */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                              Tone Words
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {c.toneWords?.map((word: string) => (
                                <span
                                  key={word}
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    background: `${c.primaryColor}22`,
                                    color: c.primaryColor,
                                  }}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                              Banned Phrases
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {c.bannedPhrases?.map((phrase: string) => (
                                <span
                                  key={phrase}
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    background: "#EF444422",
                                    color: "#EF4444",
                                  }}
                                >
                                  {phrase}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CONTENT TAB */}
                    {activeTab === "content" && (
                      <div className="space-y-6">
                        {/* Content Pillars */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Content Pillars
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {c.contentPillars?.map((pillar: any, i: number) => (
                              <div
                                key={i}
                                className="p-4 rounded-xl space-y-2"
                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                              >
                                <div className="flex items-center gap-2">
                                  <Sparkles className="size-4" style={{ color: c.primaryColor }} />
                                  <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                    {pillar.name}
                                  </h4>
                                </div>
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {pillar.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                  <Mic className="size-3" />
                                  CTA: {pillar.cta}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {pillar.platforms?.map((p: string) => (
                                    <span
                                      key={p}
                                      className="px-2 py-0.5 rounded text-[10px]"
                                      style={{
                                        background: "var(--bg-card-solid)",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Story Bank */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Story Bank
                          </h3>
                          <div className="space-y-2">
                            {c.storyBank?.map((story: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl flex items-start gap-3"
                                style={{ background: "var(--bg-elevated)" }}
                              >
                                <div
                                  className="size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                                  style={{ background: c.primaryColor, color: "#fff" }}
                                >
                                  {i + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    {story.title}
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    {story.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CALENDAR TAB */}
                    {activeTab === "calendar" && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          Content Calendar — Week 1
                        </h3>
                        <div className="space-y-2">
                          {c.calendarEntries?.map((entry: any, i: number) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl flex items-start gap-4"
                              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                            >
                              <div className="shrink-0 text-center w-12">
                                <p className="text-xs font-bold uppercase" style={{ color: c.primaryColor }}>
                                  {entry.day}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                  W{entry.week}
                                </p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                                    style={{
                                      background: `${c.primaryColor}22`,
                                      color: c.primaryColor,
                                    }}
                                  >
                                    {entry.pillar}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                                    style={{
                                      background: "var(--bg-card-solid)",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {entry.platform}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                                  {entry.content}
                                </p>
                                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                                  CTA: {entry.cta}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!clients?.length && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Briefcase className="size-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              No projects yet
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Create your first client project to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div
      className="p-4 rounded-xl space-y-2"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function BioCard({ label, text }: { label: string; text: string }) {
  return (
    <div
      className="p-4 rounded-xl space-y-1"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label} Bio
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {text}
      </p>
    </div>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 rounded-lg border"
        style={{ background: color, borderColor: "var(--border-subtle)" }}
      />
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          {color}
        </p>
      </div>
    </div>
  );
}
