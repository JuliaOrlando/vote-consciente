import { SignJWT, jwtVerify } from "jose";

// Camada de sessão (JWT assinado em cookie httpOnly).
// Mantida sem dependências de Node (bcrypt/prisma) para poder rodar também no
// middleware (Edge runtime). Apenas assina/verifica o token.

export const SESSION_COOKIE = "vc_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type SessionPayload = {
  userId: string;
  email: string;
  nome: string | null;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado. Defina-o no .env.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, nome: payload.nome })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.email !== "string") return null;

    return {
      userId: payload.sub,
      email: payload.email,
      nome: (payload.nome as string | null) ?? null,
    };
  } catch {
    // Token inválido, expirado ou assinatura incorreta.
    return null;
  }
}

// Opções padrão do cookie de sessão (httpOnly, seguro em produção).
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
