import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, startSession } from "@/lib/auth";
import { normalizeEmail, validateCredentials } from "@/lib/auth-validation";

export async function POST(request: Request) {
  let body: { nome?: unknown; email?: unknown; senha?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const senha = body.senha;
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";

  const credentialError = validateCredentials(email, senha);
  if (credentialError) {
    return NextResponse.json({ error: credentialError }, { status: 400 });
  }
  if (nome.length < 2) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }

  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
  }

  const senhaHash = await hashPassword(senha as string);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash },
    select: { id: true, nome: true, email: true },
  });

  await startSession({ userId: usuario.id, email: usuario.email!, nome: usuario.nome });

  return NextResponse.json({ success: true, usuario }, { status: 201 });
}
