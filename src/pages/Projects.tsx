import { useState, useMemo } from "react";
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
  RefreshCw,
  Layers,
  ArrowRight,
} from "lucide-react";
import { EmptyState, ErrorState, Spinner } from "@/components/states/index";

/* ─────────────────────────── Types ─────────────────────────── */

interface ClientData {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  status: string;
  tier: string;
  location: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bioFull: string;
  bioMedium: string;
  bioShort: string;
  website?: string;
  socialLinks?: Record<string, string>;
  brandHierarchy?: Array<{ tier: number; brand: string; role: string; handle: string }>;
  namingRules?: Record<string, { rule: string; wrong: string; right: string }>;
  toneWords?: string[];
  bannedPhrases?: string[];
  contentPillars?: Array<{
    name: string;
    description: string;
    cta: string;
    platforms?: string[];
  }>;
  storyBank?: Array<{ title: string; description: string }>;
  calendarEntries?: Array<{
    day: string;
    week: string;
    pillar: string;
    platform: string;
    content: string;
    cta: string;
  }>;
}

/* ─────────────────────────── Platform Icons ─────────────────────────── */

const PLATFORM_ICONS: Record<string, typeof Image> = {
  instagram: Image,
  twitter: Type,
  linkedin: FileText,
  youtube: Video,
  tiktok: Music,
  spotify: Radio,
};

/* ─────────────────────────── Sub-components ─────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="p-4 rounded-xl space-y-2"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2" style={{ color }}>
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function BioCard({ label, text }: { label: string; text: string }) {
  if (!text) {
    return (
      <div
        className="p-4 rounded-xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label} Bio
        </p>
        <p className="text-sm mt-1 italic" style={{ color: "var(--text-muted)" }}>
          Not configured
        </p>
      </div>
    );
  }
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
  if (!color) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-lg border" style={{ background: color, borderColor: "var(--border-subtle)" }} />
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

function TabEmpty({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <Icon className="size-6" style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      <p className="text-xs mt-1 max-w-sm" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </div>
  );
}

/* ─────────────────────────── Skeletons ─────────────────────────── */

function ProjectsSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded-lg mb-2" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-4 w-72 rounded" style={{ background: "var(--bg-elevated)" }} />
        </div>
        <div
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="size-14 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 rounded" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-3 w-64 rounded" style={{ background: "var(--bg-elevated)" }} />
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="h-4 w-32 rounded" style={{ background: "var(--bg-elevated)" }} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
              ))}
            </div>
            <div className="h-16 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
            <div className="h-16 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
            <div className="h-16 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function Projects() {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "brand" | "content" | "calendar">("overview");

  const {
    data: clients,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.client.list.useQuery();

  if (isLoading) return <ProjectsSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Projects
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Manage client brands, content calendars, and campaigns
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
          <ErrorState
            title="Failed to load projects"
            error={error ?? null}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Projects
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Manage client brands, content calendars, and campaigns
            </p>
          </div>
          <EmptyState
            icon={Briefcase}
            title="No projects yet"
            description="Create your first client project to start managing brands, content calendars, and campaigns."
            actionLabel="Create Project"
            onAction={() => { /* TODO: open create modal */ }}
            secondaryLabel="Learn More"
            onSecondary={() => { /* TODO: open docs */ }}
          />
        </div>
      </div>
    );
  }

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
            {clients.length} active
          </div>
        </div>

        {/* Client Cards */}
        {clients.map((c) => {
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
                aria-expanded={isExpanded}
                aria-controls={`client-content-${c.id}`}
              >
                <div
                  className="size-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                  style={{
                    background: c.primaryColor || "var(--accent-primary)",
                    color: "#fff",
                  }}
                >
                  {c.name?.charAt(0) || "?"}
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
                    {c.handle || "No handle"} · {c.tagline || "No tagline"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Palette className="size-3.5" />
                    {c.primaryColor || "N/A"}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-5" style={{ color: "var(--text-muted)" }} />
                  ) : (
                    <ChevronDown className="size-5" style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div
                  id={`client-content-${c.id}`}
                  className="border-t"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
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
                        aria-selected={activeTab === tab}
                        role="tab"
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
                          <StatCard
                            icon={Users}
                            label="Tier"
                            value={`${c.tier || "N/A"} (Hub)`}
                            color="#8B5CF6"
                          />
                          <StatCard
                            icon={MapPin}
                            label="Location"
                            value={c.location || "N/A"}
                            color="#22C55E"
                          />
                          <StatCard
                            icon={BookOpen}
                            label="Stories"
                            value={`${c.storyBank?.length ?? 0}`}
                            color="#F59E0B"
                          />
                          <StatCard
                            icon={Calendar}
                            label="Calendar"
                            value={`${c.calendarEntries?.length ?? 0} entries`}
                            color="#3B82F6"
                          />
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
                          {Object.keys(c.socialLinks ?? {}).length === 0 ? (
                            <TabEmpty
                              icon={Globe}
                              title="No social links configured"
                              description="Add social links to this client's profile to see them here."
                            />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(c.socialLinks ?? {}).map(([platform, url]) => {
                                const PlatformIcon = PLATFORM_ICONS[platform.toLowerCase()] || Globe;
                                return (
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
                                    <PlatformIcon className="size-3.5" />
                                    {platform}
                                    <ExternalLink className="size-3" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Website */}
                        {c.website ? (
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
                        ) : (
                          <TabEmpty
                            icon={Globe}
                            title="No website configured"
                            description="Add a website URL to this client's profile."
                          />
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
                          <div className="flex gap-3 flex-wrap">
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
                          {!c.brandHierarchy || c.brandHierarchy.length === 0 ? (
                            <TabEmpty
                              icon={Layers}
                              title="No brand hierarchy defined"
                              description="Define parent brands, sub-brands, and their roles."
                            />
                          ) : (
                            <div className="space-y-2">
                              {c.brandHierarchy.map((item, i) => (
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
                          )}
                        </div>

                        {/* Naming Rules */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Naming Rules
                          </h3>
                          {!c.namingRules || Object.keys(c.namingRules).length === 0 ? (
                            <TabEmpty
                              icon={Hash}
                              title="No naming rules defined"
                              description="Set rules for how to name products, features, and campaigns."
                            />
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(c.namingRules).map(([key, rule]) => (
                                <div
                                  key={key}
                                  className="p-3 rounded-xl space-y-1"
                                  style={{ background: "var(--bg-elevated)" }}
                                >
                                  <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                                    {key}
                                  </p>
                                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                                    {rule.rule}
                                  </p>
                                  <div className="flex gap-4 text-xs">
                                    <span style={{ color: "#EF4444" }}>Wrong: {rule.wrong}</span>
                                    <span style={{ color: "#22C55E" }}>Right: {rule.right}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tone & Banned */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                              Tone Words
                            </h3>
                            {!c.toneWords || c.toneWords.length === 0 ? (
                              <TabEmpty
                                icon={Mic}
                                title="No tone words"
                                description="Add words that define the brand's voice."
                              />
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {c.toneWords.map((word) => (
                                  <span
                                    key={word}
                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                      background: `${c.primaryColor || "#F59E0B"}22`,
                                      color: c.primaryColor || "#F59E0B",
                                    }}
                                  >
                                    {word}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                              Banned Phrases
                            </h3>
                            {!c.bannedPhrases || c.bannedPhrases.length === 0 ? (
                              <TabEmpty
                                icon={Hash}
                                title="No banned phrases"
                                description="Add phrases the brand should never use."
                              />
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {c.bannedPhrases.map((phrase) => (
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
                            )}
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
                          {!c.contentPillars || c.contentPillars.length === 0 ? (
                            <TabEmpty
                              icon={Layers}
                              title="No content pillars defined"
                              description="Define the core themes and topics for content creation."
                            />
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {c.contentPillars.map((pillar, i) => (
                                <div
                                  key={i}
                                  className="p-4 rounded-xl space-y-2"
                                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="size-4" style={{ color: c.primaryColor || "#F59E0B" }} />
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
                                    {pillar.platforms?.map((p) => (
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
                          )}
                        </div>

                        {/* Story Bank */}
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                            Story Bank
                          </h3>
                          {!c.storyBank || c.storyBank.length === 0 ? (
                            <TabEmpty
                              icon={BookOpen}
                              title="No stories in the bank"
                              description="Add brand stories, case studies, and testimonials."
                            />
                          ) : (
                            <div className="space-y-2">
                              {c.storyBank.map((story, i) => (
                                <div
                                  key={i}
                                  className="p-3 rounded-xl flex items-start gap-3"
                                  style={{ background: "var(--bg-elevated)" }}
                                >
                                  <div
                                    className="size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                                    style={{ background: c.primaryColor || "var(--accent-primary)", color: "#fff" }}
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
                          )}
                        </div>
                      </div>
                    )}

                    {/* CALENDAR TAB */}
                    {activeTab === "calendar" && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          Content Calendar
                        </h3>
                        {!c.calendarEntries || c.calendarEntries.length === 0 ? (
                          <TabEmpty
                            icon={Calendar}
                            title="No calendar entries"
                            description="Plan and schedule content across platforms."
                          />
                        ) : (
                          <div className="space-y-2">
                            {c.calendarEntries.map((entry, i) => (
                              <div
                                key={i}
                                className="p-4 rounded-xl flex items-start gap-4"
                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                              >
                                <div className="shrink-0 text-center w-12">
                                  <p className="text-xs font-bold uppercase" style={{ color: c.primaryColor || "var(--accent-primary)" }}>
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
                                        background: `${c.primaryColor || "#F59E0B"}22`,
                                        color: c.primaryColor || "#F59E0B",
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
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
