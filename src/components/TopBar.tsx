import { useLocation } from "react-router";
import { Bell, Settings } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/* ------------------------------------------------------------------ */
/*  Route-to-title mapping                                            */
/* ------------------------------------------------------------------ */

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/agents": "AI Agent Hub",
  "/mission-control": "Mission Control",
  "/memory-bank": "Memory Bank",
  "/content-library": "Content Studio",
  "/brand-voice": "Brand Voice",
  "/pipeline": "Analytics",
  "/settings": "Settings",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TopBar() {
  const location = useLocation();
  const { primaryColor } = useTheme();
  const title = PAGE_TITLES[location.pathname] ?? "Omega Swarm";

  return (
    <header
      className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-6"
      style={{
        backgroundColor: "var(--bg-card-solid)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Left: Page title */}
      <h1
        className="text-lg font-semibold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative flex size-9 items-center justify-center rounded-lg transition-colors duration-200"
          style={{
            background: "var(--bg-card-solid)",
            color: "var(--text-muted)",
          }}
          title="Notifications"
        >
          <Bell className="size-[18px]" />
          {/* Unread badge */}
          <span
            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold"
            style={{ background: primaryColor, color: "var(--bg-base)" }}
          >
            3
          </span>
        </button>

        {/* Settings */}
        <button
          className="flex size-9 items-center justify-center rounded-lg transition-colors duration-200"
          style={{
            background: "var(--bg-card-solid)",
            color: "var(--text-muted)",
          }}
          title="Settings"
        >
          <Settings className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}
