import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Database,
  Briefcase,
  Settings,
  Terminal,
  Palette,
  BarChart3,
  FileText,
  Mic2,
  HelpCircle,
  Eye,
  Play,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Users,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Content Library", path: "/content-library" },
  { icon: Brain, label: "AI Agents", path: "/agents" },
  { icon: Database, label: "Memory Bank", path: "/memory-bank" },
  { icon: Briefcase, label: "Projects", path: "/projects" },
  { icon: Terminal, label: "Mission Control", path: "/mission-control" },
  { icon: Users, label: "Lead Nurturing", path: "/lead-nurturing" },
  { icon: Palette, label: "Brand Voice", path: "/brand-voice" },
  { icon: BarChart3, label: "Pipeline", path: "/pipeline" },
  { icon: FileText, label: "Originals", path: "/originals" },
  { icon: Mic2, label: "Voice Studio", path: "/voice-studio" },
];

const BOTTOM_ITEMS: NavItem[] = [
  { icon: HelpCircle, label: "Documentation", path: "/documentation" },
  { icon: Eye, label: "Vision Statement", path: "/vision-statement" },
  { icon: Play, label: "Replays", path: "/replays" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activePath = location.pathname;

  /* ── Keyboard shortcut: toggle collapse with '[' key ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "[" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Close mobile drawer on route change ── */
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = useCallback(
    (path: string) => {
      navigate(path);
      setIsMobileOpen(false);
    },
    [navigate]
  );

  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent, path: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNavClick(path);
      }
    },
    [handleNavClick]
  );

  const isItemActive = (path: string) =>
    path === "/" ? activePath === "/" : activePath.startsWith(path);

  return (
    <>
      {/* ═══ Mobile hamburger trigger ═══ */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg backdrop-blur-md"
        style={{
          background: "var(--bg-card-solid)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        aria-label="Open navigation menu"
        aria-controls="sidebar-nav"
        aria-expanded={isMobileOpen}
      >
        <Zap className="size-5" />
      </button>

      {/* ═══ Mobile overlay ═══ */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ═══ Sidebar ─── desktop & mobile ═══ */}
      <aside
        id="sidebar-nav"
        className={`
          fixed top-0 left-0 z-50 h-full lg:h-[100dvh] flex flex-col border-r
          transition-all duration-300 ease-out
          ${isCollapsed ? "w-[72px]" : "w-[260px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "var(--bg-card-solid)",
          borderColor: "var(--border-subtle)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className="size-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-primary)" }}
              >
                <Zap className="size-4 text-white" />
              </div>
              <span
                className="text-sm font-semibold whitespace-nowrap transition-opacity duration-300"
                style={{ color: "var(--text-primary)" }}
              >
                Omega Swarm
              </span>
            </div>
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close navigation menu"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-muted)" }}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand ( [ )" : "Collapse ( [ )"}
          >
            {isCollapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </button>
        </div>

        {/* Scrollable nav area */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                onKeyDown={(e) => handleKeyNav(e, item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${active ? "opacity-100" : "opacity-70 hover:opacity-100 hover:bg-white/5"}
                  ${isCollapsed ? "justify-center" : ""}
                `}
                style={{
                  background: active ? "var(--bg-elevated)" : "transparent",
                  color: active ? "var(--accent-primary)" : "var(--text-primary)",
                  borderLeft: active ? "3px solid var(--accent-primary)" : "3px solid transparent",
                  outline: "none",
                }}
                role="tab"
                aria-selected={active}
                tabIndex={0}
              >
                <Icon className="size-4 shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                )}
                {active && !isCollapsed && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--accent-primary)" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t py-3 px-3 space-y-1" style={{ borderColor: "var(--border-subtle)" }}>
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                onKeyDown={(e) => handleKeyNav(e, item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${active ? "opacity-100" : "opacity-70 hover:opacity-100 hover:bg-white/5"}
                  ${isCollapsed ? "justify-center" : ""}
                `}
                style={{
                  background: active ? "var(--bg-elevated)" : "transparent",
                  color: active ? "var(--accent-primary)" : "var(--text-primary)",
                  outline: "none",
                }}
                role="tab"
                aria-selected={active}
                tabIndex={0}
              >
                <Icon className="size-4 shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                )}
              </button>
            );
          })}
          <button
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 opacity-70 hover:opacity-100 hover:bg-white/5
              ${isCollapsed ? "justify-center" : ""}
            `}
            style={{ color: "#EF4444", outline: "none" }}
            tabIndex={0}
          >
            <LogOut className="size-4 shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">Sign Out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
