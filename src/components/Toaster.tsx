import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

/**
 * Omega Swarm Toaster — Premium toast notifications
 *
 * Positioned bottom-right with custom dark theme styling.
 * Uses CSS variables for dynamic theming across all presets.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      richColors={false}
      expand={false}
      duration={4000}
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast flex w-full items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md",
          title: "text-sm font-semibold leading-tight",
          description: "text-xs leading-relaxed opacity-80",
          actionButton:
            "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80",
          cancelButton:
            "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80",
          closeButton:
            "absolute right-2 top-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity",
          error: "!border-[#EF4444]/30 !bg-[#1C1917]/95",
          success: "!border-[#84CC16]/30 !bg-[#1C1917]/95",
          warning: "!border-[#F59E0B]/30 !bg-[#1C1917]/95",
          info: "!border-[#06B6D4]/30 !bg-[#1C1917]/95",
          loading: "!border-[#A855F7]/30 !bg-[#1C1917]/95",
        },
      }}
      style={
        {
          "--normal-bg": "rgba(28, 25, 23, 0.95)",
          "--normal-text": "#FAF5EF",
          "--normal-border": "#29221D",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
