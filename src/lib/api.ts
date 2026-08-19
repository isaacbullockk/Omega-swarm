/**
 * Omega Swarm v5.0 — Typed tRPC Auth Hooks
 *
 * Thin wrappers around tRPC mutations/queries for authentication.
 * All token storage is handled here (localStorage + cookie fallback).
 */

import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

const TOKEN_KEY = "omega_swarm_token";

/* ─── helpers ─── */

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // Also set a cookie so server-side rendering can read it if needed
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/* ─── useAuth — read current user ─── */

export function useAuth() {
  const { data, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const user = data ?? null;
  const isGuest = user?.isGuest ?? false;
  const isAuthenticated = !!user && !isGuest;

  return {
    user,
    isLoading,
    error: error ?? null,
    isAuthenticated,
    isGuest,
  };
}

/* ─── useLogin — email + password ─── */

export function useLogin() {
  const utils = trpc.useUtils();

  return trpc.auth.login.useMutation({
    onSuccess: (res) => {
      setToken(res.token);
      utils.auth.me.invalidate();
    },
  });
}

/* ─── useRegister — name + email + password ─── */

export function useRegister() {
  const utils = trpc.useUtils();

  return trpc.auth.register.useMutation({
    onSuccess: (res) => {
      setToken(res.token);
      utils.auth.me.invalidate();
    },
  });
}

/* ─── useLogout — destroy session ─── */

export function useLogout() {
  const utils = trpc.useUtils();

  return trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearToken();
      utils.auth.me.invalidate();
    },
    onError: () => {
      // Even if the server logout fails, clear local state
      clearToken();
      utils.auth.me.invalidate();
    },
  });
}

/* ─── useGuest — create limited guest session ─── */

export function useGuest() {
  const utils = trpc.useUtils();

  return trpc.auth.guest.useMutation({
    onSuccess: (res) => {
      setToken(res.token);
      utils.auth.me.invalidate();
    },
  });
}

/* ─── useRefreshSession — force re-check auth state ─── */

export function useRefreshSession() {
  const utils = trpc.useUtils();
  return useCallback(() => {
    utils.auth.me.invalidate();
  }, [utils]);
}
