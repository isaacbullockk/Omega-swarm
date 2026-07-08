import { Link, useLocation } from "react-router";
import { Bell } from "lucide-react";

const navLinks = [
  { label: "Dashboard", path: "/" },
  { label: "Mission Control", path: "/mission-control" },
  { label: "Agents", path: "/agents" },
  { label: "Pipeline", path: "/pipeline" },
  { label: "Evolution", path: "/evolution" },
  { label: "Memory", path: "/memory-bank" },
  { label: "Battle", path: "/battle-arena" },
];

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;

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

        {/* Center: Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-purple-500"
                    : "text-txt-secondary hover:text-txt-primary"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-purple-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Notifications + Avatar */}
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
            OS
          </button>
        </div>
      </div>
    </header>
  );
}
