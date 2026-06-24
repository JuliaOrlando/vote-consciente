import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Lista os parlamentares acompanhados, ou — com ?parlamentarId=N — só informa se o
// usuário logado segue aquele parlamentar (usado pelo botão "Seguir").
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const idParam = new URL(request.url).searchParams.get("parlamentarId");
  if (idParam !== null) {
    const parlamentarId = Number(idParam);
    if (!Number.isInteger(parlamentarId)) {
      return NextResponse.json({ error: "Parlamentar inválido." }, { status: 400 });
    }
    const registro = await prisma.acompanhamento.findUnique({
      where: { usuarioId_parlamentarId: { usuarioId: session.userId, parlamentarId } },
      select: { id: true },
    });
    return NextResponse.json({ seguindo: registro !== null });
  }

  const acompanhamentos = await prisma.acompanhamento.findMany({
    where: { usuarioId: session.userId },
    orderBy: { criadoEm: "desc" },
    select: {
      criadoEm: true,
      parlamentar: {
        select: { id: true, nomeEleitoral: true, partido: true, uf: true, urlFoto: true },
      },
    },
  });

  return NextResponse.json({
    acompanhamentos: acompanhamentos.map((a) => ({ ...a.parlamentar, criadoEm: a.criadoEm })),
  });
}

// Passa a acompanhar um parlamentar.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { parlamentarId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parlamentarId = Number(body.parlamentarId);
  if (!Number.isInteger(parlamentarId)) {
    return NextResponse.json({ error: "Parlamentar inválido." }, { status: 400 });
  }

  const existe = await prisma.parlamentar.findUnique({ where: { id: parlamentarId }, select: { id: true } });
  if (!existe) {
    return NextResponse.json({ error: "Parlamentar não encontrado." }, { status: 404 });
  }

  await prisma.acompanhamento.upsert({
    where: { usuarioId_parlamentarId: { usuarioId: session.userId, parlamentarId } },
    update: {},
    create: { usuarioId: session.userId, parlamentarId },
  });

  return NextResponse.json({ success: true, seguindo: true });
}

// Deixa de acompanhar (parlamentarId via querystring).
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parlamentarId = Number(new URL(request.url).searchParams.get("parlamentarId"));
  if (!Number.isInteger(parlamentarId)) {
    return NextResponse.json({ error: "Parlamentar inválido." }, { status: 400 });
  }

  await prisma.acompanhamento.deleteMany({
    where: { usuarioId: session.userId, parlamentarId },
  });

  return NextResponse.json({ success: true, seguindo: false });
}
