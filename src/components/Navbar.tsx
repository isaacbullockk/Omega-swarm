import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Bell, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Dashboard", path: "/" },
  { label: "Mission", path: "/mission-control" },
  { label: "Agents", path: "/agents" },
  { label: "Pipeline", path: "/pipeline" },
  { label: "Evolution", path: "/evolution" },
  { label: "Memory", path: "/memory-bank" },
  { label: "Battle", path: "/battle-arena" },
  { label: "Brand Voice", path: "/brand-voice" },
  { label: "Content", path: "/content-library" },
  { label: "Social", path: "/social-connections" },
  { label: "Viral Studio", path: "/viral-studio" },
];

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 h-16 border-b border-border-dark bg-void-navy"
      style={{ backgroundColor: "#0D1117", borderColor: "#21262D" }}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 text-lg font-bold text-white">
            &Omega;
          </span>
          <span className="text-lg font-semibold tracking-tight text-txt-primary">
            Omega Swarm
          </span>
        </Link>

        {/* Center: Nav Links (desktop) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-purple-500"
                    : "text-txt-secondary hover:text-txt-primary"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-purple-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Notifications + Avatar + Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-txt-secondary transition-colors hover:bg-elevated hover:text-txt-primary"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {/* Badge */}
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* User Avatar */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-sm font-medium text-white"
            aria-label="User menu"
          >
            IB
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-txt-secondary transition-colors hover:bg-elevated hover:text-txt-primary lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav menu */}
      {mobileMenuOpen && (
        <div
          className="border-t lg:hidden"
          style={{ backgroundColor: "#0D1117", borderColor: "#21262D" }}
        >
          <nav className="mx-auto max-w-[1440px] px-6 py-3">
            <div className="grid grid-cols-2 gap-1">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-purple-500"
                        : "text-txt-secondary hover:text-txt-primary hover:bg-[#161B22]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
