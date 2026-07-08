import { Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="border-t border-border-dark bg-void"
      style={{ backgroundColor: "#0A0A0F", borderColor: "#21262D" }}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-txt-muted" />
          <span className="text-sm font-medium text-txt-secondary">
            Omega Swarm v4.0
          </span>
        </div>

        <p className="text-xs text-txt-muted">
          Autonomous Marketing Intelligence
        </p>

        <span className="text-xs text-txt-muted">&copy; 2025</span>
      </div>
    </footer>
  );
}
