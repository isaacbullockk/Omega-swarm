/**
 * Omega Swarm v5.0 — GuestBanner
 *
 * Sticky banner shown at the top of the page when the user is in guest mode.
 * Prompts them to register for full access. Dismissible per session.
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { X, UserCircle, ArrowRight } from "lucide-react";
import { useAuthContext } from "@/components/AuthProvider";

export default function GuestBanner() {
  const navigate = useNavigate();
  const { isGuest } = useAuthContext();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("guest_banner_dismissed") === "1";
  });

  if (!isGuest || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("guest_banner_dismissed", "1");
  };

  return (
    <div
      className="sticky top-0 z-50 w-full"
      style={{
        background: "linear-gradient(135deg, #F59E0B, #F97316)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <UserCircle className="size-5 shrink-0 text-white" />
          <p className="text-sm font-medium text-white truncate">
            You are in guest mode — features are limited
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/login")}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.25)";
            }}
          >
            Register for full access
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-md transition-colors hover:bg-white/20"
            aria-label="Dismiss guest banner"
          >
            <X className="size-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
