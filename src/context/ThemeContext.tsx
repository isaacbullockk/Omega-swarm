import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ThemePreset {
  name: string;
  void: string;
  card: string;
  input: string;
  border: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  success: string;
  cream: string;
  creamSecondary: string;
  creamMuted: string;
  particleColors: string[];
}

export interface ThemeState {
  themeId: string;
  customAccent: string | null;
  brandName: string;
  logo: string | null;
  favicon: string | null;
}

interface ThemeContextValue {
  /** Current theme preset */
  theme: ThemePreset;
  themeId: string;
  setTheme: (id: string) => void;
  /** Custom accent override (null = use theme default) */
  customAccent: string | null;
  setCustomAccent: (color: string | null) => void;
  /** Brand name shown in sidebar */
  brandName: string;
  setBrandName: (name: string) => void;
  /** Logo as base64 data URL */
  logo: string | null;
  setLogo: (dataUrl: string | null) => void;
  /** Favicon as base64 data URL */
  favicon: string | null;
  setFavicon: (dataUrl: string | null) => void;
  /** Get the effective primary color (customAccent ?? theme.primary) */
  primaryColor: string;
  /** All available presets */
  presets: Record<string, ThemePreset>;
}

/* ------------------------------------------------------------------ */
/*  Theme Presets                                                      */
/* ------------------------------------------------------------------ */

export const THEMES: Record<string, ThemePreset> = {
  savannah: {
    name: "Savannah Summer",
    void: "#0C0A09",
    card: "rgba(28,25,23,0.75)",
    input: "#231F1E",
    border: "#29221D",
    primary: "#F59E0B",
    primaryDark: "#D97706",
    secondary: "#F97316",
    success: "#84CC16",
    cream: "#FAF5EF",
    creamSecondary: "#C4B5A0",
    creamMuted: "#7A6E5F",
    particleColors: ["#F59E0B", "#F97316", "#EAB308", "#D97706"],
  },
  ocean: {
    name: "Midnight Ocean",
    void: "#0B1120",
    card: "rgba(15,23,42,0.75)",
    input: "#1E293B",
    border: "#1E3A5F",
    primary: "#3B82F6",
    primaryDark: "#2563EB",
    secondary: "#06B6D4",
    success: "#10B981",
    cream: "#F0F9FF",
    creamSecondary: "#94A3B8",
    creamMuted: "#475569",
    particleColors: ["#3B82F6", "#06B6D4", "#60A5FA", "#1D4ED8"],
  },
  forest: {
    name: "Forest Zen",
    void: "#0A1F0A",
    card: "rgba(10,30,10,0.75)",
    input: "#1A2E1A",
    border: "#2D4A2D",
    primary: "#22C55E",
    primaryDark: "#16A34A",
    secondary: "#84CC16",
    success: "#4ADE80",
    cream: "#F0FFF4",
    creamSecondary: "#86EFAC",
    creamMuted: "#4A7C4A",
    particleColors: ["#22C55E", "#84CC16", "#4ADE80", "#16A34A"],
  },
  sunset: {
    name: "Sunset Boulevard",
    void: "#1A0A1A",
    card: "rgba(30,10,30,0.75)",
    input: "#2D1A2D",
    border: "#4A2D4A",
    primary: "#E879F9",
    primaryDark: "#C026D3",
    secondary: "#F472B6",
    success: "#A78BFA",
    cream: "#FFF0F5",
    creamSecondary: "#F9A8D4",
    creamMuted: "#7C5C7C",
    particleColors: ["#E879F9", "#F472B6", "#C026D3", "#A78BFA"],
  },
};

const STORAGE_KEY = "omega-swarm-theme";
const DEFAULT_THEME_ID = "savannah";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function generateCssVariables(theme: ThemePreset, accent: string | null): string {
  const primary = accent ?? theme.primary;
  const primaryRgb = hexToRgb(primary).join(" ");
  const [r, g, b] = hexToRgb(primary);

  return `
    :root {
      /* Dynamic theme overrides */
      --bg-base: ${theme.void};
      --bg-card: ${theme.card};
      --bg-card-solid: ${theme.void};
      --bg-elevated: ${theme.border};
      --bg-input: ${theme.input};

      --accent-primary: ${primary};
      --accent-secondary: ${theme.secondary};
      --accent-tertiary: ${theme.primaryDark};
      --accent-success: ${theme.success};

      --text-primary: ${theme.cream};
      --text-secondary: ${theme.creamSecondary};
      --text-muted: ${theme.creamMuted};
      --text-accent: ${primary};

      --border-subtle: ${theme.border};
      --border-active: ${primary};
      --border-glow: rgba(${primaryRgb}, 0.3);

      --card: ${theme.card};
      --input: ${theme.input};
      --border: ${theme.border};

      --gradient-gold: linear-gradient(135deg, ${primary} 0%, ${theme.secondary} 50%, ${primary}AA 100%);
      --gradient-sunset: linear-gradient(180deg, ${theme.void} 0%, ${theme.input} 40%, ${theme.border} 100%);
      --gradient-card: linear-gradient(135deg, ${theme.card} 0%, ${theme.border}88 100%);
      --gradient-aurora: linear-gradient(90deg, ${primary}20, ${theme.secondary}20, ${theme.primaryDark}20, ${theme.success}20);
    }
  `;
}

function loadState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeState>;
      return {
        themeId: parsed.themeId && THEMES[parsed.themeId] ? parsed.themeId : DEFAULT_THEME_ID,
        customAccent: parsed.customAccent ?? null,
        brandName: parsed.brandName ?? "Omega Swarm",
        logo: parsed.logo ?? null,
        favicon: parsed.favicon ?? null,
      };
    }
  } catch { /* ignore */ }
  return {
    themeId: DEFAULT_THEME_ID,
    customAccent: null,
    brandName: "Omega Swarm",
    logo: null,
    favicon: null,
  };
}

function saveState(state: ThemeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(loadState);

  const theme = THEMES[state.themeId] ?? THEMES[DEFAULT_THEME_ID];
  const primaryColor = state.customAccent ?? theme.primary;

  const setTheme = useCallback((id: string) => {
    setState((s) => {
      const next = { ...s, themeId: id };
      saveState(next);
      return next;
    });
  }, []);

  const setCustomAccent = useCallback((color: string | null) => {
    setState((s) => {
      const next = { ...s, customAccent: color };
      saveState(next);
      return next;
    });
  }, []);

  const setBrandName = useCallback((name: string) => {
    setState((s) => {
      const next = { ...s, brandName: name };
      saveState(next);
      return next;
    });
  }, []);

  const setLogo = useCallback((dataUrl: string | null) => {
    setState((s) => {
      const next = { ...s, logo: dataUrl };
      saveState(next);
      return next;
    });
  }, []);

  const setFavicon = useCallback((dataUrl: string | null) => {
    setState((s) => {
      const next = { ...s, favicon: dataUrl };
      saveState(next);
      // Also update document favicon
      if (dataUrl) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = dataUrl;
      }
      return next;
    });
  }, []);

  // Persist favicon on mount
  useEffect(() => {
    if (state.favicon) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = state.favicon;
    }
  }, []);

  const cssVars = useMemo(
    () => generateCssVariables(theme, state.customAccent),
    [theme, state.customAccent]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeId: state.themeId,
      setTheme,
      customAccent: state.customAccent,
      setCustomAccent,
      brandName: state.brandName,
      setBrandName,
      logo: state.logo,
      setLogo,
      favicon: state.favicon,
      setFavicon,
      primaryColor,
      presets: THEMES,
    }),
    [theme, state, setTheme, setCustomAccent, setBrandName, setLogo, setFavicon, primaryColor]
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* Inject dynamic CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {children}
    </ThemeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
