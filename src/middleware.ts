import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Protege rotas privadas. Roda no Edge — por isso importa só a camada de sessão
// (jose), sem bcrypt/prisma. Ver src/lib/session.ts.

const ROTAS_PRIVADAS = ["/perfil"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const precisaAuth = ROTAS_PRIVADAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
  if (!precisaAuth) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/perfil/:path*"],
};
