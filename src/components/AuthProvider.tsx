/**
 * Omega Swarm v5.0 — AuthProvider
 *
 * Provides auth state & actions to the entire React tree via Context.
 * Queries `trpc.auth.me` on mount and whenever the token changes.
 */

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { trpc } from "@/lib/trpc";
import { useLogin, useRegister, useLogout, useGuest, clearToken } from "@/lib/api";
import { Spinner } from "@/components/states";

/* ─── Types ─── */

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isGuest: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isGuest: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  guest: () => Promise<void>;
}

interface AuthContextValue extends AuthState, AuthActions {}

/* ─── Context ─── */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}

/* ─── Provider ─── */

export function AuthProvider({ children }: { children: ReactNode }) {
  /* Query current user on mount */
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const user: User | null = userData ?? null;
  const isGuest = user?.isGuest ?? false;
  const isAuthenticated = !!user && !isGuest;

  /* Mutations */
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const guestMutation = useGuest();

  /* Actions */
  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await registerMutation.mutateAsync({ name, email, password });
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Even if server logout fails, clear local state
      clearToken();
    }
  }, [logoutMutation]);

  const guest = useCallback(async () => {
    await guestMutation.mutateAsync();
  }, [guestMutation]);

  /* Derived loading state */
  const isLoading =
    userLoading ||
    loginMutation.isPending ||
    registerMutation.isPending ||
    logoutMutation.isPending ||
    guestMutation.isPending;

  /* Value memo */
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error: userError ? (userError instanceof Error ? userError : new Error(String(userError))) : null,
      isAuthenticated,
      isGuest,
      login,
      register,
      logout,
      guest,
    }),
    [user, isLoading, userError, isAuthenticated, isGuest, login, register, logout, guest]
  );

  /* Listen for token changes across tabs (optional) */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "omega_swarm_token") {
        // Token changed in another tab — reload page to pick up new auth state
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
