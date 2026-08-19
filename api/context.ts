/**
 * Omega Swarm v5.0 — tRPC Context with Authentication
 *
 * Extracts session from cookie or Authorization header.
 * Looks up user in PostgreSQL (or falls back to JSON store in dev).
 */

import { type CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { parse } from "cookie";
import { db, isPostgresAvailable } from "../db/connection";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isGuest: boolean;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface Context {
  user: User | null;
  session: Session | null;
  req: Request;
}

export async function createContext({ req }: CreateHTTPContextOptions): Promise<Context> {
  const cookieHeader = req.headers.get("cookie");
  const cookies = cookieHeader ? parse(cookieHeader) : {};
  const sessionToken = cookies["session"] || req.headers.get("x-session-token");

  if (!sessionToken || !isPostgresAvailable()) {
    return { user: null, session: null, req };
  }

  try {
    // Look up session
    const sessionResult = await db!
      .select()
      .from(sessions)
      .where(eq(sessions.token, sessionToken))
      .limit(1);

    const session = sessionResult[0];

    if (!session) {
      return { user: null, session: null, req };
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await db!.delete(sessions).where(eq(sessions.id, session.id));
      return { user: null, session: null, req };
    }

    // Look up user
    const userResult = await db!
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return { user: null, session: null, req };
    }

    // Check if guest session expired
    if (user.isGuest && user.guestExpiresAt && new Date() > user.guestExpiresAt) {
      await db!.delete(sessions).where(eq(sessions.id, session.id));
      await db!.delete(users).where(eq(users.id, user.id));
      return { user: null, session: null, req };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isGuest: user.isGuest,
      },
      session: {
        id: session.id,
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      req,
    };
  } catch (err) {
    console.error("[Auth] Session lookup error:", (err as Error).message);
    return { user: null, session: null, req };
  }
}
