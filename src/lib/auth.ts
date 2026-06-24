import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  type SessionPayload,
  signSession,
  verifySession,
  sessionCookieOptions,
} from "@/lib/session";

// Camada de autenticação do lado do servidor (Node runtime).
// Hash de senha (bcrypt) + leitura/escrita do cookie de sessão.

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Lê a sessão atual a partir do cookie (em Server Components e Route Handlers).
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

// Cria o cookie de sessão para o usuário.
export async function startSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());
}

// Remove o cookie de sessão (logout).
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
