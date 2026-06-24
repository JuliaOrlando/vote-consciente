import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { sha256 } from "@/app/api/auth/forgot-password/route";

export async function POST(request: Request) {
  let body: { token?: unknown; senha?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }
  if (!isValidPassword(body.senha)) {
    return NextResponse.json(
      { error: `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, usuarioId: true, expiraEm: true, usadoEm: true },
  });

  if (!registro || registro.usadoEm || registro.expiraEm.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
  }

  const senhaHash = await hashPassword(body.senha);

  // Atualiza a senha e marca o token como usado de forma atômica.
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: registro.usuarioId }, data: { senhaHash } }),
    prisma.passwordResetToken.update({ where: { id: registro.id }, data: { usadoEm: new Date() } }),
  ]);

  return NextResponse.json({ success: true });
}
