import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";

/* ── Eager imports (small / always-needed) ── */
import Login from "@/pages/Login";

/* ── Lazy imports (large pages ── code-split) ── */
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ContentLibrary = lazy(() => import("@/pages/ContentLibrary"));
const MissionControl = lazy(() => import("@/pages/MissionControl"));
const MemoryBank = lazy(() => import("@/pages/MemoryBank"));
const Projects = lazy(() => import("@/pages/Projects"));
const Settings = lazy(() => import("@/pages/Settings"));
const Agents = lazy(() => import("@/pages/Agents"));
const BrandVoice = lazy(() => import("@/pages/BrandVoice"));
const Pipeline = lazy(() => import("@/pages/Pipeline"));
const Originals = lazy(() => import("@/pages/Originals"));
const VoiceStudio = lazy(() => import("@/pages/VoiceStudio"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const VisionStatement = lazy(() => import("@/pages/VisionStatement"));
const Replays = lazy(() => import("@/pages/Replays"));

/* ── Shared fallback for lazy pages ── */
function PageSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-64 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
      </div>
    </div>
  );
}

/**
 * Page wrapper with per-route error boundary.
 *
 * Isolates crashes so a single broken page doesn't bring down the entire app.
 */
function PageWithBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

/* ── Route config (single source of truth) ── */
const ROUTES = [
  { path: "/", element: <Dashboard />, withBoundary: true },
  { path: "/content-library", element: <ContentLibrary />, withBoundary: true },
  { path: "/mission-control", element: <MissionControl />, withBoundary: true },
  { path: "/memory-bank", element: <MemoryBank />, withBoundary: true },
  { path: "/projects", element: <Projects />, withBoundary: true },
  { path: "/settings", element: <Settings />, withBoundary: true },
  { path: "/agents", element: <Agents />, withBoundary: true },
  { path: "/brand-voice", element: <BrandVoice />, withBoundary: true },
  { path: "/pipeline", element: <Pipeline />, withBoundary: true },
  { path: "/originals", element: <Originals />, withBoundary: true },
  { path: "/voice-studio", element: <VoiceStudio />, withBoundary: true },
  { path: "/documentation", element: <Documentation />, withBoundary: true },
  { path: "/vision", element: <VisionStatement />, withBoundary: true },
  { path: "/replays", element: <Replays />, withBoundary: true },
] as const;

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          {ROUTES.map(({ path, element, withBoundary }) => (
            <Route
              key={path}
              path={path}
              element={
                withBoundary ? (
                  <PageWithBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                      {element}
                    </Suspense>
                  </PageWithBoundary>
                ) : (
                  <Suspense fallback={<PageSkeleton />}>
                    {element}
                  </Suspense>
                )
              }
            />
          ))}
        </Route>
      </Routes>
    </>
  );
}
