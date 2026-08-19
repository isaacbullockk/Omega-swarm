/**
 * Omega Swarm v5.0 — AuthGuard
 *
 * Route guard that checks authentication before rendering children.
 * Redirects unauthenticated users to /login.
 * Shows a loading spinner while auth state is being checked.
 */

import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthContext } from "@/components/AuthProvider";
import { Spinner } from "@/components/states";

interface AuthGuardProps {
  children: ReactNode;
  /**
   * Set to true to allow guest users through.
   * Defaults to true — most routes accept guests.
   */
  allowGuest?: boolean;
  /**
   * Fallback redirect path for unauthenticated users.
   */
  fallback?: string;
}

export default function AuthGuard({
  children,
  allowGuest = true,
  fallback = "/login",
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, isGuest } = useAuthContext();
  const location = useLocation();

  /* Loading — show spinner */ 
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="size-12" />
          <p
            className="text-sm font-medium animate-pulse"
            style={{ color: "var(--text-muted, #78716C)" }}
          >
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  /* Not logged in at all — redirect to login */ 
  if (!user) {
    return (
      <Navigate
        to={fallback}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  /* Logged in but guest, and route requires full auth */ 
  if (isGuest && !allowGuest) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  /* Authenticated (or guest with allowGuest=true) — render children */ 
  return <>{children}</>;
}
