import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getVoteLabelByKey,
  normalizeVoteBucketKey,
  type ProposicaoInspectionData,
  type VoteBucketKey,
} from "@/lib/proposicao-inspection";

const getCachedInspection = unstable_cache(
  async (proposicaoId: number): Promise<ProposicaoInspectionData | null> => {
    const proposition = await prisma.proposicao.findUnique({
      where: { id: proposicaoId },
      select: { id: true },
    });

    if (!proposition) {
      return null;
    }

    const nominalVotes = await prisma.votoParlamentar.findMany({
      where: { proposicaoId },
      select: {
        voto: true,
        dataVoto: true,
        parlamentar: {
          select: {
            id: true,
            nomeEleitoral: true,
            partido: true,
            uf: true,
          },
        },
      },
    });

    const totalDeputyVotes = nominalVotes.length;

    const voteCounters = new Map<
      VoteBucketKey,
      {
        total: number;
        rawValues: Set<string>;
      }
    >();

    const partyCounters = new Map<string, number>();

    const individualDeputyVotes = nominalVotes
      .map((vote) => {
        const voteKey = normalizeVoteBucketKey(vote.voto);
        const existingVoteCounter = voteCounters.get(voteKey);

        if (existingVoteCounter) {
          existingVoteCounter.total += 1;
          existingVoteCounter.rawValues.add(vote.voto);
        } else {
          voteCounters.set(voteKey, {
            total: 1,
            rawValues: new Set([vote.voto]),
          });
        }

        const party = vote.parlamentar.partido?.trim() || "Sem partido";
        partyCounters.set(party, (partyCounters.get(party) ?? 0) + 1);

        return {
          parlamentarId: vote.parlamentar.id,
          nomeEleitoral: vote.parlamentar.nomeEleitoral,
          partido: party,
          uf: vote.parlamentar.uf,
          voto: vote.voto,
          dataVoto: vote.dataVoto.toISOString(),
        };
      })
      .sort(
        (a, b) =>
          a.partido.localeCompare(b.partido, "pt-BR") ||
          a.nomeEleitoral.localeCompare(b.nomeEleitoral, "pt-BR") ||
          a.uf.localeCompare(b.uf, "pt-BR")
      );

    const voteBreakdown = [...voteCounters.entries()]
      .map(([key, value]) => ({
        key,
        label: getVoteLabelByKey(key),
        total: value.total,
        percentage: totalDeputyVotes === 0 ? 0 : Number(((value.total / totalDeputyVotes) * 100).toFixed(1)),
        rawValues: [...value.rawValues].sort((a, b) => a.localeCompare(b, "pt-BR")),
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"));

    const partyBreakdown = [...partyCounters.entries()]
      .map(([partido, total]) => ({
        partido,
        total,
        percentage: totalDeputyVotes === 0 ? 0 : Number(((total / totalDeputyVotes) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.total - a.total || a.partido.localeCompare(b.partido, "pt-BR"));

    const generalVotingResult = voteBreakdown.length > 0;
    const availableData = {
      propositionMetadata: true,
      generalVotingResult,
      individualDeputyVotes: individualDeputyVotes.length > 0,
      chartReadyAggregate: voteBreakdown.length > 0 || partyBreakdown.length > 0,
      groupedHistoricalVotes: false,
    };

    const unavailableData: string[] = [];

    if (!availableData.generalVotingResult) {
      unavailableData.push("Resultado geral da votacao nominal indisponivel");
    }

    if (!availableData.individualDeputyVotes) {
      unavailableData.push("Votos individuais por parlamentar indisponiveis");
    }

    if (!availableData.chartReadyAggregate) {
      unavailableData.push("Dados agregados para graficos indisponiveis");
    }

    if (!availableData.groupedHistoricalVotes) {
      unavailableData.push("Historico agrupado de sessoes/votacoes nao disponivel nesta fonte");
    }

    return {
      proposicaoId,
      totalDeputyVotes,
      voteBreakdown,
      partyBreakdown,
      individualDeputyVotes,
      availableData,
      unavailableData,
    };
  },
  ["simulador-proposicao-inspection-v1"],
  { revalidate: 3600 }
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const proposicaoId = Number(resolvedParams.id);

  if (!Number.isInteger(proposicaoId) || proposicaoId <= 0) {
    return NextResponse.json({ success: false, error: "Identificador invalido." }, { status: 400 });
  }

  try {
    const inspectionData = await getCachedInspection(proposicaoId);

    if (!inspectionData) {
      return NextResponse.json({ success: false, error: "Proposicao nao encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, dados: inspectionData });
  } catch (error) {
    console.error("Erro ao carregar dados de inspecao da proposicao:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao carregar dados de inspecao." },
      { status: 500 }
    );
  }
}
