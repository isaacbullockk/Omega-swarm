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
import VoiceStudio from "@/pages/VoiceStudio";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";

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
        <Route path="/voice-studio" element={<VoiceStudio />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
