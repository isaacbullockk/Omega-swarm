/**
 * Omega Swarm v5.0 — Authentication Utils
 *
 * - bcrypt for password hashing
 * - crypto for session tokens
 * - zod for input validation
 */

import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";

export const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── Validation Schemas ───

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
