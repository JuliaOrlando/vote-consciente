import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startSession, verifyPassword } from "@/lib/auth";
import { normalizeEmail } from "@/lib/auth-validation";

export async function POST(request: Request) {
  let body: { email?: unknown; senha?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const senha = typeof body.senha === "string" ? body.senha : "";

  if (!email || !senha) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nome: true, email: true, senhaHash: true },
  });

  // Mensagem genérica de propósito: não revela se o e-mail existe (anti-enumeração).
  const credenciaisInvalidas = NextResponse.json(
    { error: "E-mail ou senha incorretos." },
    { status: 401 }
  );

  if (!usuario || !usuario.senhaHash) return credenciaisInvalidas;

  const senhaConfere = await verifyPassword(senha, usuario.senhaHash);
  if (!senhaConfere) return credenciaisInvalidas;

  await startSession({ userId: usuario.id, email: usuario.email!, nome: usuario.nome });

  return NextResponse.json({
    success: true,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  });
}
