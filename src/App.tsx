import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MissionControl from "@/pages/MissionControl";
import Agents from "@/pages/Agents";
import Pipeline from "@/pages/Pipeline";
import Evolution from "@/pages/Evolution";
import MemoryBank from "@/pages/MemoryBank";
import BattleArena from "@/pages/BattleArena";
import BrandVoice from "@/pages/BrandVoice";
import ContentLibrary from "@/pages/ContentLibrary";
import SocialConnections from "@/pages/SocialConnections";
import ViralStudio from "@/pages/ViralStudio";
import Login from "@/pages/Login";

/**
 * Omega Swarm — Autonomous Marketing Intelligence Dashboard
 * Dark-themed AI marketing agency platform with multi-page routing.
 */
export default function App() {
  return (
    <Routes>
      {/* Login: No Layout wrapper */}
      <Route path="/login" element={<Login />} />

      {/* All other routes: Wrapped in Layout (Navbar + Footer) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mission-control" element={<MissionControl />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/evolution" element={<Evolution />} />
        <Route path="/memory-bank" element={<MemoryBank />} />
        <Route path="/battle-arena" element={<BattleArena />} />
        <Route path="/brand-voice" element={<BrandVoice />} />
        <Route path="/content-library" element={<ContentLibrary />} />
        <Route path="/social-connections" element={<SocialConnections />} />
        <Route path="/viral-studio" element={<ViralStudio />} />
      </Route>
    </Routes>
  );
}
