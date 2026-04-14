"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Vote,
  X,
} from "lucide-react";
import { Badge, EmptyState, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { useMatchSelection } from "@/hooks/useMatchSelection";
import {
  fetchProposicaoInspection,
  readInspectionSessionCache,
  writeInspectionSessionCache,
} from "@/lib/proposicao-inspection-client";
import type { ProposicaoInspectionData } from "@/lib/proposicao-inspection";
import { buildOfficialPropositionUrl, getCachedSimuladorCards, type SimuladorCard } from "@/lib/simulador-cache";
import { cn } from "@/lib/utils";

const MAX_TABLE_SCROLL_HEIGHT = "max-h-[26rem]";

function hasSummary(summary: string | null, title: string) {
  if (!summary) return false;

  const normalizedSummary = summary.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedSummary.length > 0 && normalizedSummary !== normalizedTitle;
}


async function fetchSimuladorCards() {
  const response = await fetch("/api/proposicoes");

  if (!response.ok) {
    throw new Error(`Falha ao carregar proposições: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !Array.isArray(data.dados)) {
    throw new Error("Resposta inválida ao carregar proposições.");
  }

  return data.dados;
}

function BackToVotacoesButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push("/simulador");
      }}
      className={buttonStyles({ variant: "ghost", size: "sm", className: "w-fit" })}
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar para Votações
    </button>
  );
}

export default function ProposicaoDetailPage() {
  const params = useParams<{ id: string }>();
  const proposicaoId = Number(params?.id);
  const isValidId = Number.isInteger(proposicaoId) && proposicaoId > 0;

  const [proposicoes, setProposicoes] = useState<SimuladorCard[]>([]);
  const [loadingProposicoes, setLoadingProposicoes] = useState(true);
  const [inspectionData, setInspectionData] = useState<ProposicaoInspectionData | null>(null);
  const [inspectionError, setInspectionError] = useState("");
  const [loadingInspection, setLoadingInspection] = useState(true);
  const [inspectionLoadSeed, setInspectionLoadSeed] = useState(0);
  const { selectedSet, toggleSelection } = useMatchSelection();

  useEffect(() => {
    let active = true;

    getCachedSimuladorCards(fetchSimuladorCards)
      .then((data) => {
        if (!active) return;
        setProposicoes(data);
      })
      .catch((error) => {
        console.error("Falha ao preparar detalhes da proposição", error);
        if (active) {
          setProposicoes([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingProposicoes(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isValidId) {
      setLoadingInspection(false);
      setInspectionData(null);
      setInspectionError("Identificador de proposição inválido.");
      return;
    }

    let active = true;
    const sessionCache = readInspectionSessionCache();
    const cachedInspection = sessionCache[proposicaoId];

    if (cachedInspection) {
      setInspectionData(cachedInspection);
      setInspectionError("");
      setLoadingInspection(false);
      return () => {
        active = false;
      };
    }

    setLoadingInspection(true);
    setInspectionError("");

    fetchProposicaoInspection(proposicaoId)
      .then((data) => {
        if (!active) return;
        setInspectionData(data);
        setInspectionError("");

        writeInspectionSessionCache({
          ...readInspectionSessionCache(),
          [proposicaoId]: data,
        });
      })
      .catch((error) => {
        if (!active) return;
        console.error(`Falha ao carregar detalhes da proposição ${proposicaoId}`, error);
        setInspectionData(null);
        setInspectionError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar dados detalhados desta proposicao."
        );
      })
      .finally(() => {
        if (!active) return;
        setLoadingInspection(false);
      });

    return () => {
      active = false;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [inspectionLoadSeed, isValidId, proposicaoId]);

  const proposicao = useMemo(
    () => (isValidId ? proposicoes.find((item) => item.id === proposicaoId) ?? null : null),
    [isValidId, proposicaoId, proposicoes]
  );

  const isSelected = isValidId ? selectedSet.has(proposicaoId) : false;
  const officialUrl = proposicao?.urlOficial ?? (isValidId ? buildOfficialPropositionUrl(proposicaoId) : "/simulador");
  const voteBreakdown = inspectionData?.voteBreakdown ?? [];
  const partyBreakdown = inspectionData?.partyBreakdown ?? [];
  const individualDeputyVotes = inspectionData?.individualDeputyVotes ?? [];
  const maxVoteBreakdown = voteBreakdown[0]?.total ?? 1;

  if (!isValidId) {
    return (
      <div className="space-y-4">
        <BackToVotacoesButton />
        <EmptyState
          icon={AlertCircle}
          title="Proposição não referenciada"
          description="O identificador desta proposição é inválido. Volte para Votações e selecione outro item."
          action={
            <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "md" })}>
              Voltar para Votações
            </Link>
          }
        />
      </div>
    );
  }

  if (loadingProposicoes || loadingInspection) {
    return (
      <SurfaceCard className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Carregando detalhes da proposição</h1>
          <p className="max-w-md text-sm leading-6 text-[color:var(--ink-muted)]">
            Buscando metadados e dados nominais de votação para esta inspeção completa.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <BackToVotacoesButton />

      <SurfaceCard className="p-6 sm:p-8">
        <SectionIntro
          eyebrow="Detalhe da proposição"
          title={proposicao?.numOficial ?? `Proposição ${proposicaoId}`}
          description={
            proposicao
              ? proposicao.titulo
              : "Detalhes completos da proposição selecionada, com dados nominais de votação disponíveis."
          }
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleSelection(proposicaoId)}
                className={buttonStyles({
                  variant: isSelected ? "secondary" : "primary",
                  size: "md",
                  className: isSelected ? "border-[color:rgba(176,57,38,0.18)] text-[color:var(--danger-ink)]" : undefined,
                })}
              >
                {isSelected ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {isSelected ? "Remover do Meu Match" : "Adicionar ao Meu Match"}
              </button>
              <Link href="/simulador/resultado" className={buttonStyles({ variant: "secondary", size: "md" })}>
                Ir para Meu Match
              </Link>
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "secondary", size: "md" })}
              >
                Ficha oficial
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          }
          className="mb-0"
        />
      </SurfaceCard>

      {proposicao && hasSummary(proposicao.resumoCidadao, proposicao.titulo) ? (
        <SurfaceCard className="space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">Contexto da proposição</h2>
          <p className="text-sm leading-7 text-[color:var(--ink-muted)]">{proposicao.resumoCidadao}</p>
        </SurfaceCard>
      ) : null}

      {inspectionError ? (
        <SurfaceCard className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-2 text-sm text-[color:var(--danger-ink)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{inspectionError}</p>
          </div>
          <button
            type="button"
            onClick={() => setInspectionLoadSeed((current) => current + 1)}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Tentar novamente
          </button>
        </SurfaceCard>
      ) : null}

      {inspectionData ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <SurfaceCard className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">Inspeção completa</Badge>
              {inspectionData.totalDeputyVotes > 0 ? (
                <Badge tone="neutral">{inspectionData.totalDeputyVotes} votos nominais registrados</Badge>
              ) : (
                <Badge tone="neutral">Sem votos nominais nesta fonte</Badge>
              )}
            </div>

            {voteBreakdown.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[color:var(--ink)]">Resultado geral da votação nominal</h3>
                <div className="grid gap-2">
                  {voteBreakdown.map((bucket) => (
                    <div key={bucket.key} className="vc-panel space-y-2">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-[color:var(--ink)]">{bucket.label}</span>
                        <span className="text-[color:var(--ink-muted)]">
                          {bucket.total} ({bucket.percentage}%)
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]"
                          style={{ width: `${Math.max((bucket.total / maxVoteBreakdown) * 100, 7)}%` }}
                        />
                      </div>
                      {bucket.key === "OUTROS" && bucket.rawValues.length > 0 ? (
                        <p className="text-xs text-[color:var(--ink-soft)]">
                          Valores fora do padrão: {bucket.rawValues.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Vote}
                title="Resultado nominal indisponível"
                description="Esta proposição não possui dados de resultado nominal na fonte atual."
              />
            )}

            {partyBreakdown.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[color:var(--ink)]">Distribuição por partido</h3>
                <div className={cn("vc-scroll-area overflow-auto rounded-2xl border border-[color:rgba(183,199,193,0.5)]", MAX_TABLE_SCROLL_HEIGHT)}>
                  <table className="w-full border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                          Partido
                        </th>
                        <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-right text-[color:var(--ink-soft)]">
                          Votos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {partyBreakdown.map((row) => (
                        <tr key={row.partido}>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                            {row.partido}
                          </td>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-right text-[color:var(--ink-muted)]">
                            {row.total} ({row.percentage}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                Sem agregação por partido para esta proposição.
              </div>
            )}

            {individualDeputyVotes.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[color:var(--ink)]">Votos individuais dos parlamentares</h3>
                <div className="vc-scroll-area max-h-[38rem] overflow-auto rounded-2xl border border-[color:rgba(183,199,193,0.5)]">
                  <table className="w-full border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                          Deputado
                        </th>
                        <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                          Partido/UF
                        </th>
                        <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-right text-[color:var(--ink-soft)]">
                          Voto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {individualDeputyVotes.map((vote) => (
                        <tr key={`${vote.parlamentarId}-${vote.voto}-${vote.dataVoto}`}>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                            {vote.nomeEleitoral}
                          </td>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-muted)]">
                            {vote.partido}/{vote.uf}
                          </td>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-right text-[color:var(--ink-muted)]">
                            {vote.voto}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                Dados de votos individuais indisponíveis para esta proposição.
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="space-y-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">Ficha de dados disponíveis</h2>
            <div className="overflow-hidden rounded-2xl border border-[color:rgba(183,199,193,0.5)]">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <tbody>
                  <tr>
                    <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                      Metadados da proposição
                    </th>
                    <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                      {inspectionData.availableData.propositionMetadata ? "Disponível" : "Indisponível"}
                    </td>
                  </tr>
                  <tr>
                    <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                      Resultado geral nominal
                    </th>
                    <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                      {inspectionData.availableData.generalVotingResult ? "Disponível" : "Indisponível"}
                    </td>
                  </tr>
                  <tr>
                    <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                      Votos individuais
                    </th>
                    <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                      {inspectionData.availableData.individualDeputyVotes ? "Disponível" : "Indisponível"}
                    </td>
                  </tr>
                  <tr>
                    <th className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                      Agregados para gráficos
                    </th>
                    <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                      {inspectionData.availableData.chartReadyAggregate ? "Disponível" : "Indisponível"}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-[color:var(--ink-soft)]">Histórico agrupado</th>
                    <td className="px-3 py-2 font-medium text-[color:var(--ink)]">
                      {inspectionData.availableData.groupedHistoricalVotes ? "Disponível" : "Indisponível"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {inspectionData.unavailableData.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[color:var(--ink)]">Campos indisponíveis nesta fonte</h3>
                <ul className="space-y-2">
                  {inspectionData.unavailableData.map((message) => (
                    <li key={message} className="vc-panel text-sm text-[color:var(--ink-muted)]">
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                Todos os blocos desta inspeção possuem dados disponíveis nesta fonte.
              </div>
            )}

            <div className="vc-panel space-y-2">
              <p className="text-sm font-semibold text-[color:var(--ink)]">Próximo passo</p>
              <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                {isSelected
                  ? "Esta proposição já está salva no Meu Match. Você pode votar nela agora."
                  : "Adicione esta proposição ao Meu Match para registrar sua opinião e comparar com os deputados."}
              </p>
              <Link href="/simulador/resultado" className={buttonStyles({ variant: "primary", size: "sm" })}>
                <Sparkles className="h-4 w-4" />
                Abrir Meu Match
              </Link>
            </div>
          </SurfaceCard>
        </div>
      ) : (
        <EmptyState
          icon={AlertCircle}
          title="Proposição não encontrada no diretório atual"
          description="Não foi possível localizar os metadados desta proposição na listagem carregada."
          action={
            <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "md" })}>
              Voltar para Votações
            </Link>
          }
        />
      )}
    </div>
  );
}
