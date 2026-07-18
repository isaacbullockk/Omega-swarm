import { useState } from "react";
import { useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  Bot,
  Rocket,
  Brain,
  Library,
  Mic,
  BarChart3,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hexagon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Platform",
    items: [
      { label: "Dashboard", path: "/", icon: <LayoutDashboard className="size-[18px]" /> },
      { label: "Agents", path: "/agents", icon: <Bot className="size-[18px]" /> },
      { label: "Mission Control", path: "/mission-control", icon: <Rocket className="size-[18px]" /> },
      { label: "Memory Bank", path: "/memory-bank", icon: <Brain className="size-[18px]" /> },
    ],
  },
  {
    title: "Studio",
    items: [
      { label: "Content Studio", path: "/content-library", icon: <Library className="size-[18px]" /> },
      { label: "Brand Voice", path: "/brand-voice", icon: <Mic className="size-[18px]" /> },
      { label: "Analytics", path: "/pipeline", icon: <BarChart3 className="size-[18px]" /> },
      { label: "Originals", path: "/originals", icon: <Sparkles className="size-[18px]" /> },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", path: "/settings", icon: <Settings className="size-[18px]" /> },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-10 flex h-screen flex-col border-r transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 64 : 240,
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex h-14 items-center gap-3 border-b px-4"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--gradient-gold)" }}
        >
          <Hexagon className="size-5" style={{ color: "#0C0A09" }} />
        </div>
        {!collapsed && (
          <span
            className="text-lg font-bold tracking-tight whitespace-nowrap"
            style={{ color: "var(--text-primary)" }}
          >
            Omega Swarm
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p
                className="mb-2 px-4 text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {section.title}
              </p>
            )}
            {collapsed && (
              <div
                className="mx-auto mb-2 h-px w-8"
                style={{ background: "var(--border-subtle)" }}
              />
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                      style={{
                        color: active ? "var(--text-primary)" : "var(--text-muted)",
                        background: active
                          ? "rgba(245, 158, 11, 0.08)"
                          : "transparent",
                        borderLeft: active
                          ? "3px solid var(--accent-primary)"
                          : "3px solid transparent",
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className="shrink-0 transition-colors duration-200"
                        style={{
                          color: active ? "var(--accent-primary)" : "var(--text-muted)",
                        }}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Agent Status ── */}
      <div
        className="border-t px-3 py-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="flex items-center gap-2.5 rounded-lg px-2 py-2"
          style={{ background: "rgba(245, 158, 11, 0.04)" }}
        >
          <div className="relative shrink-0">
            <div
              className="size-8 rounded-full border-2 flex items-center justify-center text-xs"
              style={{
                borderColor: "var(--accent-primary)",
                background: "rgba(245, 158, 11, 0.1)",
                color: "var(--accent-primary)",
              }}
            >
              <Bot className="size-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 bg-emerald-500" style={{ borderColor: "var(--bg-elevated)" }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p
                className="truncate text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Swarm Active
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                8/14 agents online
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 w-full items-center justify-center border-t transition-colors duration-200 hover:bg-white/5"
        style={{ borderColor: "var(--border-subtle)" }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="size-4" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronLeft className="size-4" style={{ color: "var(--text-muted)" }} />
        )}
      </button>
    </aside>
  );
}
