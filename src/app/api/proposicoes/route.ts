import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getCachedProposicoes = unstable_cache(
  async () =>
    prisma.proposicao.findMany({
      where: {
        autores: { some: {} },
        // Inclui proposições com votos definitivos OU com votos ainda em
        // tramitação, para que as votações em andamento continuem na lista.
        OR: [
          { votosParlamentar: { some: {} } },
          { votosTramitacao: { some: {} } },
        ],
      },
      select: {
        id: true,
        siglaTipo: true,
        numero: true,
        ano: true,
        numOficial: true,
        ementaOficial: true,
        resumoCidadao: true,
        categoria: true,
        statusDescricao: true,
        autores: {
          select: {
            parlamentar: {
              select: {
                nomeEleitoral: true,
              },
            },
          },
        },
      },
      orderBy: [{ rankingRelevancia: "desc" }, { ano: "desc" }, { id: "desc" }],
    }),
  ["simulador-proposicoes-base-v2"],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const proposicoes = await getCachedProposicoes();
    return NextResponse.json({ success: true, dados: proposicoes });
  } catch (error) {
    console.error("Erro ao buscar proposições:", error);
    return NextResponse.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
