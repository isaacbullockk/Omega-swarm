import { useState } from "react";
import { Outlet } from "react-router";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ParticleBackground from "@/components/ParticleBackground";
import { ThemeProvider } from "@/context/ThemeContext";

/**
 * Layout — Responsive sidebar + main content.
 * Desktop: fixed 240px sidebar left.
 * Mobile: hidden sidebar, hamburger menu opens overlay.
 */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex min-h-[100dvh]" style={{ backgroundColor: "var(--bg-base)" }}>
        {/* Canvas 2D Particle Background (fixed, behind everything) */}
        <ParticleBackground />

        {/* Mobile hamburger button (visible only on small screens) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-4 top-3 z-[60] flex size-10 items-center justify-center rounded-lg md:hidden"
          style={{
            background: "var(--bg-card-solid)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
          }}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 shrink-0 transform transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ width: 240 }}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col" style={{ zIndex: 1 }}>
          <TopBar />
          <main
            className="flex-1 overflow-y-auto p-4 md:p-6"
            style={{
              background: "var(--gradient-sunset)",
              minHeight: "calc(100dvh - 56px)",
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
