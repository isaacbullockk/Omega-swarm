import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import MissionControl from "@/pages/MissionControl";
import MemoryBank from "@/pages/MemoryBank";
import ContentLibrary from "@/pages/ContentLibrary";
import BrandVoice from "@/pages/BrandVoice";
import Pipeline from "@/pages/Pipeline";
import Originals from "@/pages/Originals";
import Login from "@/pages/Login";

/* Placeholder for Settings */
function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
        <span className="text-3xl">🚧</span>
      </div>
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Coming soon</p>
    </div>
  );
}

/**
 * Omega Swarm v4.2 — Animated AI Marketing Agency Dashboard
 */
export default function App() {
  return (
    <Routes>
      {/* Login: No Layout wrapper */}
      <Route path="/login" element={<Login />} />

      {/* All routes wrapped in Layout (Sidebar + TopBar + Particles) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/mission-control" element={<MissionControl />} />
        <Route path="/memory-bank" element={<MemoryBank />} />
        <Route path="/content-library" element={<ContentLibrary />} />
        <Route path="/brand-voice" element={<BrandVoice />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/originals" element={<Originals />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  );
}
