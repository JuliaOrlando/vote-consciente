import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth-validation";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);

  // Resposta sempre genérica para não revelar quais e-mails existem.
  const respostaGenerica = NextResponse.json({
    success: true,
    message: "Se houver uma conta com este e-mail, enviaremos um link de redefinição.",
  });

  if (!email) return respostaGenerica;

  const usuario = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  if (!usuario) return respostaGenerica;

  // Invalida tokens anteriores e cria um novo.
  await prisma.passwordResetToken.deleteMany({ where: { usuarioId: usuario.id, usadoEm: null } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      usuarioId: usuario.id,
      tokenHash: sha256(token),
      expiraEm: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/redefinir-senha?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);

  return respostaGenerica;
}
