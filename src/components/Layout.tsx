import { Outlet } from "react-router";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ParticleBackground from "@/components/ParticleBackground";

/**
 * Layout — Sidebar (left, fixed) + Main Content (right, flex-grow).
 * Uses nested route pattern with Outlet.
 * ParticleBackground sits behind everything as fixed background.
 */
export default function Layout() {
  return (
    <div className="flex min-h-[100dvh]" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Canvas 2D Particle Background (fixed, behind everything) */}
      <ParticleBackground />

      {/* Sidebar (fixed left) */}
      <div className="shrink-0" style={{ width: 240 }}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col" style={{ zIndex: 1 }}>
        <TopBar />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{
            background: "var(--gradient-sunset)",
            minHeight: "calc(100dvh - 56px)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
