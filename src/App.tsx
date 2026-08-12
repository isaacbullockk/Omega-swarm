import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";
import { toast } from "sonner";
import Layout from "@/components/Layout";

/* ── Lazy load all pages for code splitting ── */
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agents = lazy(() => import("@/pages/Agents"));
const MissionControl = lazy(() => import("@/pages/MissionControl"));
const MemoryBank = lazy(() => import("@/pages/MemoryBank"));
const ContentLibrary = lazy(() => import("@/pages/ContentLibrary"));
const BrandVoice = lazy(() => import("@/pages/BrandVoice"));
const Pipeline = lazy(() => import("@/pages/Pipeline"));
const Originals = lazy(() => import("@/pages/Originals"));
const VoiceStudio = lazy(() => import("@/pages/VoiceStudio"));
const Settings = lazy(() => import("@/pages/Settings"));

/**
 * ToastRouteHandler — Shows toast notifications for route-level events
 * and provides a global error toast handler.
 */
function ToastRouteHandler() {
  const location = useLocation();

  useEffect(() => {
    // Show a contextual toast when navigating to key sections
    const path = location.pathname;
    if (path === "/content-library") {
      toast.info("Content Library — Create posts and AI reels", {
        id: "route-toast",
        duration: 2500,
      });
    }
  }, [location]);

  return null;
}

/** Skeleton loader shown while page chunks download */
function PageSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
            <div className="h-4 w-32 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          </div>
          <div className="h-10 w-32 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Omega Swarm v4.2 — Code-split, lazy-loaded routes
 */
export default function App() {
  return (
    <>
      <ToastRouteHandler />
      <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageSkeleton />}>
          <Login />
        </Suspense>
      } />

      <Route element={<Layout />}>
        <Route path="/" element={
          <Suspense fallback={<PageSkeleton />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="/agents" element={
          <Suspense fallback={<PageSkeleton />}>
            <Agents />
          </Suspense>
        } />
        <Route path="/mission-control" element={
          <Suspense fallback={<PageSkeleton />}>
            <MissionControl />
          </Suspense>
        } />
        <Route path="/memory-bank" element={
          <Suspense fallback={<PageSkeleton />}>
            <MemoryBank />
          </Suspense>
        } />
        <Route path="/content-library" element={
          <Suspense fallback={<PageSkeleton />}>
            <ContentLibrary />
          </Suspense>
        } />
        <Route path="/brand-voice" element={
          <Suspense fallback={<PageSkeleton />}>
            <BrandVoice />
          </Suspense>
        } />
        <Route path="/pipeline" element={
          <Suspense fallback={<PageSkeleton />}>
            <Pipeline />
          </Suspense>
        } />
        <Route path="/originals" element={
          <Suspense fallback={<PageSkeleton />}>
            <Originals />
          </Suspense>
        } />
        <Route path="/voice-studio" element={
          <Suspense fallback={<PageSkeleton />}>
            <VoiceStudio />
          </Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<PageSkeleton />}>
            <Settings />
          </Suspense>
        } />
      </Route>
    </Routes>
    </>
  );
}
