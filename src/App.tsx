import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";

/* Placeholder pages */
function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
        style={{ background: "rgba(245, 158, 11, 0.1)" }}
      >
        <span className="text-3xl">🚧</span>
      </div>
      <h1
        className="text-xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        Coming soon
      </p>
    </div>
  );
}

/**
 * Omega Swarm v4.2 — Animated AI Marketing Agency Dashboard
 * Nested route pattern: Layout renders Outlet for child pages.
 */
export default function App() {
  return (
    <Routes>
      {/* Login: No Layout wrapper */}
      <Route path="/login" element={<Login />} />

      {/* All other routes: Wrapped in Layout (Sidebar + TopBar + Particles) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<Placeholder title="AI Agent Hub" />} />
        <Route path="/mission-control" element={<Placeholder title="Mission Control" />} />
        <Route path="/memory-bank" element={<Placeholder title="Memory Bank" />} />
        <Route path="/content-library" element={<Placeholder title="Content Studio" />} />
        <Route path="/brand-voice" element={<Placeholder title="Brand Voice" />} />
        <Route path="/pipeline" element={<Placeholder title="Analytics" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  );
}
