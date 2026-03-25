import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getProjetosAutorados(parlamentarId: number) {
  const countLocal = await prisma.proposicaoAutor.count({
    where: { parlamentarId },
  });

  if (countLocal > 0) {
    const relacoes = await prisma.proposicaoAutor.findMany({
      where: { parlamentarId },
      include: {
        proposicao: {
          select: {
            id: true,
            siglaTipo: true,
            numero: true,
            ano: true,
            numOficial: true,
            dataApresentacao: true,
            ementaOficial: true,
            statusDescricao: true,
            idSituacao: true,
          },
        },
      },
      orderBy: {
        proposicao: { ano: "desc" },
      },
    });

    return relacoes.map((relacao) => ({
      ...relacao.proposicao,
      ementa: relacao.proposicao.ementaOficial,
      statusProposicao: {
        descricaoSituacao: relacao.proposicao.statusDescricao,
      },
    }));
  }

  const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${parlamentarId}&siglaTipo=PL&siglaTipo=PEC&ordem=DESC&ordenarPor=ano&itens=100`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error("Falha ao buscar proposições da API");
  }

  const data = await response.json();
  return data.dados || [];
}

async function getDespesasDetalhadas(parlamentarId: number) {
  const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${parlamentarId}/despesas?ordem=DESC&ordenarPor=dataDocumento&itens=10`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error("Falha ao buscar despesas detalhadas");
  }

  const data = await response.json();
  return data.dados || [];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const parlamentarId = Number(resolvedParams.id);

  if (!Number.isFinite(parlamentarId)) {
    return NextResponse.json({ success: false, error: "Identificador inválido." }, { status: 400 });
  }

  try {
    const [projetos, despesas] = await Promise.all([
      getProjetosAutorados(parlamentarId),
      getDespesasDetalhadas(parlamentarId),
    ]);

    return NextResponse.json({ success: true, dados: { projetos, despesas } });
  } catch (error) {
    console.error("Erro ao carregar dados complementares do deputado:", error);
    return NextResponse.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
