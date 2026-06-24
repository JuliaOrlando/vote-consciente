"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { type ProposicaoInspectionData, normalizeVoteBucketKey } from "@/lib/proposicao-inspection";
import { buildOfficialPropositionUrl, getCachedSimuladorCards, type SimuladorCard } from "@/lib/simulador-cache";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const VOTE_COLORS: Record<string, string> = {
  SIM: "#2563eb",
  NAO: "#dc2626",
  ABSTENCAO: "#facc15",
  OBSTRUCAO: "#f97316",
  OUTROS: "#9ca3af",
};

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

function BackButtonInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMatch = searchParams?.get("from") === "match";

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fromMatch ? "/simulador/resultado" : "/simulador");
      }}
      className={buttonStyles({ variant: "ghost", size: "sm", className: "w-fit" })}
    >
      <ArrowLeft className="h-4 w-4" />
      {fromMatch ? "Voltar para Meu Match" : "Voltar para Votações"}
    </button>
  );
}

function BackToVotacoesButton() {
  return (
    <Suspense 
      fallback={
        <button type="button" className={buttonStyles({ variant: "ghost", size: "sm", className: "w-fit" })}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      }
    >
      <BackButtonInner />
    </Suspense>
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
  const [deputySearchTerm, setDeputySearchTerm] = useState("");
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
  const individualDeputyVotes = inspectionData?.individualDeputyVotes ?? [];

  const partyDetailedBreakdown = useMemo(() => {
    if (!individualDeputyVotes || individualDeputyVotes.length === 0) return [];

    const map = new Map<string, { sim: number; nao: number; total: number }>();
    let grandTotal = 0;

    for (const vote of individualDeputyVotes) {
      if (!vote.partido) continue;
      const p = vote.partido;
      if (!map.has(p)) map.set(p, { sim: 0, nao: 0, total: 0 });
      const stats = map.get(p)!;
      stats.total++;
      grandTotal++;

      const normalized = normalizeVoteBucketKey(vote.voto);
      if (normalized === "SIM") stats.sim++;
      else if (normalized === "NAO") stats.nao++;
    }

    return Array.from(map.entries())
      .map(([partido, stats]) => ({
        partido,
        sim: stats.sim,
        nao: stats.nao,
        total: stats.total,
        percentage: grandTotal > 0 ? Math.round((stats.total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [individualDeputyVotes]);

  const filteredDeputyVotes = useMemo(() => {
    if (!deputySearchTerm.trim()) return individualDeputyVotes;
    const term = deputySearchTerm.trim().toLowerCase();
    return individualDeputyVotes.filter((v) =>
      v.nomeEleitoral.toLowerCase().includes(term) || v.partido.toLowerCase().includes(term)
    );
  }, [individualDeputyVotes, deputySearchTerm]);

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
        <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-stretch">
          <SurfaceCard className="flex flex-col space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">Inspeção completa</Badge>
              {inspectionData.totalDeputyVotes > 0 ? (
                <Badge tone="neutral">{inspectionData.totalDeputyVotes} votos nominais registrados</Badge>
              ) : (
                <Badge tone="neutral">Sem votos nominais nesta fonte</Badge>
              )}
              {inspectionData.totalDeputyVotes > 0 ? (
                inspectionData.votacaoFinalizada ? (
                  <Badge tone="primary">Resultado definitivo</Badge>
                ) : (
                  <Badge tone="warning">Votação em tramitação</Badge>
                )
              ) : null}
            </div>

            {inspectionData.totalDeputyVotes > 0 && !inspectionData.votacaoFinalizada ? (
              <div className="flex items-start gap-2 rounded-2xl border border-[color:rgba(217,119,6,0.3)] bg-[color:rgba(251,191,36,0.08)] p-3 text-sm text-[color:var(--ink-muted)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:#b45309]" />
                <p>
                  A votação desta proposição <strong>ainda não foi concluída</strong>. Exibimos o
                  resultado da votação mais recente disponível, que pode não refletir o desfecho final.
                  {inspectionData.votacaoStage ? (
                    <span className="mt-1 block text-xs text-[color:var(--ink-soft)]">
                      Etapa exibida: {inspectionData.votacaoStage}
                    </span>
                  ) : null}
                </p>
              </div>
            ) : null}

            {voteBreakdown.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[color:var(--ink)]">Resultado geral da votação nominal</h3>
                <div className="h-[280px] rounded-2xl border border-[color:rgba(183,199,193,0.5)] bg-white p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        isAnimationActive={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="flex flex-col gap-1.5 rounded-xl border border-[color:rgba(183,199,193,0.3)] bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: payload[0].color }} />
                                  <span className="font-semibold text-[color:var(--ink)]">{data.label}</span>
                                </div>
                                <p className="pl-5 text-sm font-medium text-[color:var(--ink-muted)]">
                                  {data.total} votos
                                  <span className="ml-1.5 rounded-md bg-[color:rgba(183,199,193,0.15)] px-1.5 py-0.5 text-xs font-bold text-[color:var(--ink)]">
                                    {data.percentage ?? 0}%
                                  </span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={voteBreakdown}
                        dataKey="total"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        minAngle={12}
                        stroke="none"
                      >
                        {voteBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={VOTE_COLORS[entry.key] || VOTE_COLORS.OUTROS} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Vote}
                title="Resultado nominal indisponível"
                description="Esta proposição não possui dados de resultado nominal na fonte atual."
              />
            )}

            {partyDetailedBreakdown.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[color:var(--ink)]">Distribuição por partido</h3>
                <div className="flex max-h-[360px] flex-col overflow-hidden rounded-2xl border border-[color:rgba(183,199,193,0.5)] bg-white">
                  <div className="vc-scroll-area flex-1 overflow-y-auto p-4">
                    <div className="grid gap-3 pr-2">
                      {partyDetailedBreakdown.map((item) => {
                        const simWidth = Math.max((item.sim / item.total) * 100, 0);
                        const naoWidth = Math.max((item.nao / item.total) * 100, 0);

                        return (
                          <div key={item.partido} className="vc-panel flex flex-col gap-2 p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-[color:var(--ink)]">{item.partido}</span>
                              <span className="text-[color:var(--ink-muted)]">
                                {item.total} votos ({item.percentage}%)
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              {/* Sim bar */}
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
                                  <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${simWidth}%` }} />
                                </div>
                                <span className="w-12 text-right text-[10px] font-medium text-[#10b981]">Sim: {item.sim}</span>
                              </div>

                              {/* Nao bar */}
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
                                  <div className="h-full rounded-full bg-[#ec4899]" style={{ width: `${naoWidth}%` }} />
                                </div>
                                <span className="w-12 text-right text-[10px] font-medium text-[#ec4899]">Não: {item.nao}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                Sem agregação por partido para esta proposição.
              </div>
            )}
          </SurfaceCard>

          <div className="relative flex min-h-[500px] flex-col lg:min-h-0">
            <SurfaceCard className="flex flex-col p-5 sm:p-6 lg:absolute lg:inset-0">
              {individualDeputyVotes.length > 0 ? (
                <div className="flex h-full flex-col space-y-4 min-h-0">
                  <div className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <h3 className="text-lg font-semibold text-[color:var(--ink)]">Votos dos parlamentares</h3>
                    <input
                      type="search"
                      placeholder="Buscar por deputado(a) ou partido"
                      value={deputySearchTerm}
                      onChange={(e) => setDeputySearchTerm(e.target.value)}
                      className="vc-input max-w-sm"
                    />
                  </div>
                  <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-2xl border border-[color:rgba(183,199,193,0.5)] bg-white">
                    <div className="vc-scroll-area flex-1 overflow-y-auto">
                      <table className="w-full border-separate border-spacing-0 text-left text-sm">
                        <thead className="sticky top-0 bg-white/95 backdrop-blur-sm">
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
                          {filteredDeputyVotes.length > 0 ? (
                            filteredDeputyVotes.map((vote) => (
                              <tr key={`${vote.parlamentarId}-${vote.voto}-${vote.dataVoto}`}>
                                <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                                  {vote.nomeEleitoral}
                                  {!vote.ativo ? (
                                    <span className="ml-2 rounded-md bg-[color:rgba(159,179,171,0.2)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--ink-soft)]">
                                      não está mais em exercício
                                    </span>
                                  ) : null}
                                </td>
                                <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-muted)]">
                                  {vote.partido}/{vote.uf}
                                </td>
                                <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-right text-[color:var(--ink-muted)]">
                                  {vote.voto}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-3 py-8 text-center text-[color:var(--ink-muted)]">
                                Nenhum deputado encontrado para "{deputySearchTerm}".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                  Dados de votos individuais indisponíveis para esta proposição.
                </div>
              )}
            </SurfaceCard>
          </div>

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
