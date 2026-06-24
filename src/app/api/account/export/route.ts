import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Exporta todos os dados do usuário logado em JSON (download).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nome: true,
      email: true,
      perfilIdeologico: true,
      dataCriacao: true,
      votos: {
        select: { proposicaoId: true, voto: true, dataVoto: true },
        orderBy: { dataVoto: "desc" },
      },
      acompanhamentos: {
        select: {
          criadoEm: true,
          parlamentar: { select: { id: true, nomeEleitoral: true, partido: true, uf: true } },
        },
        orderBy: { criadoEm: "desc" },
      },
    },
  });

  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const payload = {
    exportadoEm: new Date().toISOString(),
    conta: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfilIdeologico: usuario.perfilIdeologico,
      dataCriacao: usuario.dataCriacao,
    },
    votos: usuario.votos,
    parlamentaresAcompanhados: usuario.acompanhamentos.map((a) => ({
      ...a.parlamentar,
      acompanhadoDesde: a.criadoEm,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="meus-dados-vote-consciente.json"',
    },
  });
}
