import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const VOTOS_VALIDOS = new Set(["SIM", "NAO", "PULAR"]);

type VotoEntrada = { proposicaoId: number; voto: string };

// GET: votos salvos do usuário logado.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const votos = await prisma.votoUsuario.findMany({
    where: { usuarioId: session.userId },
    select: { proposicaoId: true, voto: true },
  });

  return NextResponse.json({ votos });
}

// PUT: sincroniza (faz merge) os votos locais do usuário com a conta.
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { votos?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!Array.isArray(body.votos)) {
    return NextResponse.json({ error: "Formato de votos inválido." }, { status: 400 });
  }

  // Normaliza e descarta entradas inválidas.
  const entradas: VotoEntrada[] = body.votos
    .map((item): VotoEntrada | null => {
      const proposicaoId = Number((item as { proposicaoId?: unknown })?.proposicaoId);
      const voto = String((item as { voto?: unknown })?.voto ?? "").toUpperCase();
      if (!Number.isInteger(proposicaoId) || !VOTOS_VALIDOS.has(voto)) return null;
      return { proposicaoId, voto };
    })
    .filter((item): item is VotoEntrada => item !== null);

  // Só persiste votos de proposições que existem (a FK exige).
  const existentes = await prisma.proposicao.findMany({
    where: { id: { in: entradas.map((e) => e.proposicaoId) } },
    select: { id: true },
  });
  const idsValidos = new Set(existentes.map((p) => p.id));

  let salvos = 0;
  for (const entrada of entradas) {
    if (!idsValidos.has(entrada.proposicaoId)) continue;
    await prisma.votoUsuario.upsert({
      where: {
        usuarioId_proposicaoId: { usuarioId: session.userId, proposicaoId: entrada.proposicaoId },
      },
      update: { voto: entrada.voto },
      create: { usuarioId: session.userId, proposicaoId: entrada.proposicaoId, voto: entrada.voto },
    });
    salvos++;
  }

  return NextResponse.json({ success: true, salvos });
}
