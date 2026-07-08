import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MissionControl from "@/pages/MissionControl";
import Agents from "@/pages/Agents";
import Pipeline from "@/pages/Pipeline";
import Evolution from "@/pages/Evolution";
import MemoryBank from "@/pages/MemoryBank";
import BattleArena from "@/pages/BattleArena";
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
      </Route>
    </Routes>
  );
}
