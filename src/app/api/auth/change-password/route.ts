import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";

// Troca de senha do usuário logado (exige a senha atual; não usa e-mail).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { senhaAtual?: unknown; novaSenha?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const senhaAtual = typeof body.senhaAtual === "string" ? body.senhaAtual : "";
  if (!isValidPassword(body.novaSenha)) {
    return NextResponse.json(
      { error: `A nova senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { senhaHash: true },
  });
  if (!usuario || !usuario.senhaHash) {
    return NextResponse.json({ error: "Conta sem senha definida." }, { status: 400 });
  }

  const senhaConfere = await verifyPassword(senhaAtual, usuario.senhaHash);
  if (!senhaConfere) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const novaSenha = body.novaSenha;
  if (await verifyPassword(novaSenha, usuario.senhaHash)) {
    return NextResponse.json({ error: "A nova senha deve ser diferente da atual." }, { status: 400 });
  }

  await prisma.usuario.update({
    where: { id: session.userId },
    data: { senhaHash: await hashPassword(novaSenha) },
  });

  return NextResponse.json({ success: true });
}
