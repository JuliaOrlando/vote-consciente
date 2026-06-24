import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Retorna o usuário logado (ou null). Usado pelo cliente para saber o estado de auth.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ usuario: null });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { id: true, nome: true, email: true },
  });

  return NextResponse.json({ usuario });
}

// Atualiza dados básicos do perfil (por enquanto, apenas o nome).
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { nome?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (nome.length < 2) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id: session.userId },
    data: { nome },
    select: { id: true, nome: true, email: true },
  });

  return NextResponse.json({ success: true, usuario });
}
