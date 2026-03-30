"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Check,
  ExternalLink,
  Eye,
  Layers,
  List,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Vote,
  X,
} from "lucide-react";
import { Badge, EmptyState, MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getCachedSimuladorCards, type SimuladorCard } from "@/lib/simulador-cache";
import type { ProposicaoInspectionData } from "@/lib/proposicao-inspection";

const MATCH_SELECTION_STORAGE_KEY = "matchSelectedPropositions";
const INITIAL_BROWSE_RENDER_COUNT = 80;
const BROWSE_RENDER_STEP = 160;
const MAX_PARTY_ROWS = 8;
const MAX_INDIVIDUAL_VOTES_ROWS = 12;
const INACTIVE_STATUS_KEYWORDS = [
  "arquiv",
  "rejeitad",
  "aprovad",
  "retirad",
  "norma jurídica",
  "despacho de arquivamento",
];

function hasSummary(summary: string | null, title: string) {
  if (!summary) return false;

  const normalizedSummary = summary.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedSummary.length > 0 && normalizedSummary !== normalizedTitle;
}

function isInactiveStatus(status: string | null) {
  if (!status) return false;

  const normalizedStatus = status.trim().toLowerCase();
  return INACTIVE_STATUS_KEYWORDS.some((keyword) => normalizedStatus.includes(keyword));
}

function parseStoredSelection(value: string | null) {
  if (!value) return [] as number[];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  } catch {
    return [];
  }
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

async function fetchProposicaoInspection(id: number): Promise<ProposicaoInspectionData> {
  const response = await fetch(`/api/proposicoes/${id}/inspection`);

  if (!response.ok) {
    throw new Error(`Falha ao carregar inspecao da proposicao: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.dados) {
    throw new Error("Resposta invalida ao carregar detalhes da votacao.");
  }

  return data.dados as ProposicaoInspectionData;
}

export default function SimuladorPage() {
  const [proposicoes, setProposicoes] = useState<SimuladorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleBrowseCount, setVisibleBrowseCount] = useState(INITIAL_BROWSE_RENDER_COUNT);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [inspectedId, setInspectedId] = useState<number | null>(null);
  const [inspectionDataById, setInspectionDataById] = useState<Record<number, ProposicaoInspectionData>>({});
  const [inspectionErrorsById, setInspectionErrorsById] = useState<Record<number, string>>({});
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    let active = true;

    getCachedSimuladorCards(fetchSimuladorCards)
      .then((data) => {
        if (!active) return;
        setProposicoes(data);
      })
      .catch((error) => {
        console.error("Falha ao preparar diretório de votações", error);
        if (active) {
          setProposicoes([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(parseStoredSelection(localStorage.getItem(MATCH_SELECTION_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(MATCH_SELECTION_STORAGE_KEY, JSON.stringify(selectedIds));
  }, [selectedIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const proposicoesVisiveis = useMemo(
    () =>
      showOnlyActive
        ? proposicoes.filter((proposicao) => !isInactiveStatus(proposicao.statusDescricao))
        : proposicoes,
    [proposicoes, showOnlyActive]
  );

  const proposicoesFiltradas = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    if (!term) return [...proposicoesVisiveis].reverse();

    return [...proposicoesVisiveis]
      .reverse()
      .filter((proposicao) =>
        `${proposicao.numOficial} ${proposicao.titulo} ${proposicao.resumoCidadao ?? ""} ${proposicao.categoria} ${proposicao.statusDescricao ?? ""}`
          .toLowerCase()
          .includes(term)
      );
  }, [deferredSearchTerm, proposicoesVisiveis]);

  const proposicoesExibidas = useMemo(
    () => proposicoesFiltradas.slice(0, visibleBrowseCount),
    [proposicoesFiltradas, visibleBrowseCount]
  );

  const inspectedProposicao = useMemo(() => {
    if (inspectedId !== null) {
      const explicitSelection = proposicoes.find((proposicao) => proposicao.id === inspectedId);
      if (explicitSelection) {
        return explicitSelection;
      }
    }

    return proposicoesFiltradas[0] ?? null;
  }, [inspectedId, proposicoes, proposicoesFiltradas]);
  const inspectedProposicaoId = inspectedProposicao?.id ?? null;

  useEffect(() => {
    if (inspectedProposicaoId === null) return;
    if (inspectionDataById[inspectedProposicaoId] || inspectionErrorsById[inspectedProposicaoId]) return;

    let active = true;

    fetchProposicaoInspection(inspectedProposicaoId)
      .then((data) => {
        if (!active) return;

        setInspectionDataById((prev) => ({
          ...prev,
          [inspectedProposicaoId]: data,
        }));
      })
      .catch((error) => {
        if (!active) return;
        console.error(`Falha ao carregar dados de inspecao da proposicao ${inspectedProposicaoId}`, error);

        setInspectionErrorsById((prev) => ({
          ...prev,
          [inspectedProposicaoId]:
            error instanceof Error ? error.message : "Nao foi possivel carregar dados de inspecao desta votacao.",
        }));
      });

    return () => {
      active = false;
    };
  }, [inspectedProposicaoId, inspectionDataById, inspectionErrorsById]);

  const selectedProposicoes = useMemo(
    () => selectedIds.map((id) => proposicoes.find((proposicao) => proposicao.id === id)).filter(Boolean) as SimuladorCard[],
    [proposicoes, selectedIds]
  );

  const topCategorias = useMemo(() => {
    const counts = new Map<string, number>();
    for (const proposicao of proposicoesVisiveis) {
      const category = proposicao.categoria || "GERAL";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 4);
  }, [proposicoesVisiveis]);

  const maxTopCategoria = topCategorias[0]?.[1] ?? 1;

  const relatedCategoryCount = useMemo(() => {
    if (!inspectedProposicao) return 0;
    return proposicoes.filter((item) => item.categoria === inspectedProposicao.categoria).length;
  }, [inspectedProposicao, proposicoes]);

  const relatedStatusCount = useMemo(() => {
    if (!inspectedProposicao?.statusDescricao) return 0;
    return proposicoes.filter((item) => item.statusDescricao === inspectedProposicao.statusDescricao).length;
  }, [inspectedProposicao, proposicoes]);

  const totalProposicoes = proposicoes.length;
  const visibleCount = proposicoesFiltradas.length;
  const selectedCount = selectedIds.length;
  const inspectedVoteData = inspectedProposicaoId !== null ? inspectionDataById[inspectedProposicaoId] ?? null : null;
  const inspectedVoteError = inspectedProposicaoId !== null ? inspectionErrorsById[inspectedProposicaoId] ?? "" : "";
  const isLoadingInspectedVoteData = inspectedProposicaoId !== null && !inspectedVoteData && !inspectedVoteError;
  const voteBreakdown = inspectedVoteData?.voteBreakdown ?? [];
  const partyBreakdown = inspectedVoteData?.partyBreakdown ?? [];
  const individualDeputyVotes = inspectedVoteData?.individualDeputyVotes ?? [];
  const maxVoteBreakdown = voteBreakdown[0]?.total ?? 1;

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((currentId) => currentId !== id);
      }

      return [...prev, id];
    });
  };

  const retryInspectionDataLoad = (id: number) => {
    setInspectionErrorsById((prev) => {
      if (!prev[id]) return prev;

      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
          <SectionIntro
            eyebrow="Votações"
            title="Explore proposições e selecione o que entra no seu Meu Match"
            description="Esta área é para navegar, inspecionar detalhes e montar sua lista pessoal. A votação da sua opinião acontece em Meu Match."
            action={
              <div className="flex flex-wrap gap-2">
                <Link href="/simulador/resultado" className={buttonStyles({ variant: "primary", size: "lg" })}>
                  Abrir Meu Match
                </Link>
                {selectedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className={buttonStyles({ variant: "secondary", size: "lg" })}
                  >
                    Limpar lista
                  </button>
                ) : null}
              </div>
            }
            className="mb-0"
          />

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile
              icon={List}
              label="Na base"
              value={totalProposicoes}
              description="Total de proposições disponíveis para exploração."
              tone="neutral"
            />
            <MetricTile
              icon={Sparkles}
              label="Na sua lista"
              value={selectedCount}
              description="Itens salvos para votar depois em Meu Match."
              tone="success"
            />
            <MetricTile
              icon={Layers}
              label="Com filtro atual"
              value={visibleCount}
              description="Resultados que atendem aos filtros e busca atuais."
              tone="primary"
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">Panorama do diretório de proposições</h2>
            <p className="text-sm text-[color:var(--ink-muted)]">
              Distribuição das categorias mais frequentes no catálogo atual (não representa resultado nominal).
            </p>
          </div>
          <Badge tone="neutral">
            <BarChart3 className="h-3.5 w-3.5" />
            Visão geral
          </Badge>
        </div>

        {topCategorias.length === 0 ? (
          <p className="text-sm text-[color:var(--ink-muted)]">Sem dados de categoria para exibir no momento.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topCategorias.map(([categoria, count]) => (
              <div key={categoria} className="vc-panel space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">{categoria}</p>
                  <p className="text-sm text-[color:var(--ink-soft)]">{count}</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]"
                    style={{ width: `${Math.max((count / maxTopCategoria) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-pressed={showOnlyActive}
              onClick={() => {
                setShowOnlyActive((current) => !current);
                setVisibleBrowseCount(INITIAL_BROWSE_RENDER_COUNT);
              }}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                showOnlyActive
                  ? "border-[color:rgba(13,107,100,0.18)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                  : "border-[color:var(--border)] bg-white text-[color:var(--ink-muted)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--ink)]"
              )}
            >
              {showOnlyActive ? "Somente em tramitação" : "Todas as proposições"}
            </button>
            <p className="text-sm text-[color:var(--ink-soft)]">
              Votações concluídas continuam disponíveis para inspeção quando o filtro é ampliado.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--ink-soft)]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setVisibleBrowseCount(INITIAL_BROWSE_RENDER_COUNT);
              }}
              placeholder="Buscar por número oficial, título, categoria ou situação"
              className="vc-input pl-12"
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite">
              Exibindo {Math.min(proposicoesExibidas.length, proposicoesFiltradas.length)} de {proposicoesFiltradas.length} resultado
              {proposicoesFiltradas.length === 1 ? "" : "s"} na busca atual.
            </p>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{selectedCount} na lista do match</Badge>
              <Link href="/simulador/resultado" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Ir para Meu Match
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
            <p className="text-sm text-[color:var(--ink-muted)]">Carregando diretório de proposições...</p>
          </div>
        ) : proposicoesFiltradas.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhuma proposição encontrada"
            description="Ajuste os filtros ou termo de busca para inspecionar outras votações."
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
            <SurfaceCard as="div" className="overflow-hidden p-0">
              <ul
                aria-label="Diretório de proposições para inspeção"
                className="divide-y divide-[color:rgba(183,199,193,0.5)]"
              >
                {proposicoesExibidas.map((proposicao) => {
                  const isSelected = selectedSet.has(proposicao.id);
                  const isInspected = inspectedProposicaoId === proposicao.id;

                  return (
                    <li key={proposicao.id} className="px-4 py-5 sm:px-5 sm:py-6">
                      <article className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="primary">{proposicao.categoria}</Badge>
                          <Badge tone="neutral">{proposicao.numOficial}</Badge>
                          {proposicao.statusDescricao ? <Badge tone="neutral">{proposicao.statusDescricao}</Badge> : null}
                          {isSelected ? (
                            <Badge tone="success">
                              <Check className="h-3.5 w-3.5" />
                              Salvo no Meu Match
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Ainda não salvo</Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold leading-7 text-[color:var(--ink)]">{proposicao.titulo}</h3>
                          {hasSummary(proposicao.resumoCidadao, proposicao.titulo) ? (
                            <p className="text-sm leading-6 text-[color:var(--ink-muted)]">{proposicao.resumoCidadao}</p>
                          ) : (
                            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                              Resumo curto não disponível. Use a ficha oficial para leitura completa.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectedId(proposicao.id)}
                            className={buttonStyles({
                              variant: isInspected ? "primary" : "secondary",
                              size: "sm",
                            })}
                          >
                            <Eye className="h-4 w-4" />
                            {isInspected ? "Inspecionando" : "Inspecionar"}
                          </button>

                          <a
                            href={proposicao.urlOficial}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonStyles({ variant: "secondary", size: "sm" })}
                          >
                            Ficha oficial
                            <ExternalLink className="h-4 w-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => toggleSelection(proposicao.id)}
                            className={buttonStyles({
                              variant: isSelected ? "secondary" : "primary",
                              size: "sm",
                              className: isSelected
                                ? "border-[color:rgba(176,57,38,0.18)] text-[color:var(--danger-ink)] hover:border-[color:rgba(176,57,38,0.24)]"
                                : undefined,
                            })}
                          >
                            {isSelected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {isSelected ? "Remover da lista" : "Adicionar ao Meu Match"}
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>

              {proposicoesExibidas.length < proposicoesFiltradas.length ? (
                <div className="border-t border-[color:rgba(183,199,193,0.5)] px-4 py-4 sm:px-5">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleBrowseCount((current) => Math.min(current + BROWSE_RENDER_STEP, proposicoesFiltradas.length))
                    }
                    className={buttonStyles({ variant: "secondary", size: "md", className: "w-full" })}
                  >
                    Mostrar mais {Math.min(BROWSE_RENDER_STEP, proposicoesFiltradas.length - proposicoesExibidas.length)} proposições
                  </button>
                </div>
              ) : null}
            </SurfaceCard>

            <SurfaceCard
              as="aside"
              className="vc-scroll-area max-h-[calc(100dvh-9rem)] space-y-4 overflow-y-auto pr-1.5 md:max-h-[calc(100dvh-8rem)] xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)]"
            >
              {inspectedProposicao ? (
                <>
                  <div className="space-y-2">
                    <p className="vc-eyebrow">Inspeção da votação</p>
                    <h2 className="text-2xl font-semibold text-[color:var(--ink)]">{inspectedProposicao.numOficial}</h2>
                    <p className="text-sm leading-6 text-[color:var(--ink-muted)]">{inspectedProposicao.titulo}</p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[color:rgba(183,199,193,0.5)]">
                    <table className="w-full border-separate border-spacing-0 text-left text-sm">
                      <tbody>
                        <tr>
                          <th scope="row" className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                            Categoria
                          </th>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                            {inspectedProposicao.categoria}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                            Situação
                          </th>
                          <td className="border-b border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                            {inspectedProposicao.statusDescricao || "Não informada"}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" className="px-3 py-2 text-[color:var(--ink-soft)]">
                            Itens na mesma categoria
                          </th>
                          <td className="px-3 py-2 font-medium text-[color:var(--ink)]">{relatedCategoryCount}</td>
                        </tr>
                        <tr>
                          <th scope="row" className="border-t border-[color:rgba(183,199,193,0.5)] px-3 py-2 text-[color:var(--ink-soft)]">
                            Itens com mesma situação
                          </th>
                          <td className="border-t border-[color:rgba(183,199,193,0.5)] px-3 py-2 font-medium text-[color:var(--ink)]">
                            {inspectedProposicao.statusDescricao ? relatedStatusCount : "N/A"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--ink)]">Dados nominais da votação</p>
                      {inspectedVoteData?.totalDeputyVotes ? (
                        <Badge tone="primary">{inspectedVoteData.totalDeputyVotes} votos registrados</Badge>
                      ) : null}
                    </div>

                    {isLoadingInspectedVoteData && !inspectedVoteData ? (
                      <div className="vc-panel flex items-center gap-3 text-sm text-[color:var(--ink-muted)]">
                        <Loader2 className="h-4 w-4 animate-spin text-[color:var(--accent)]" />
                        Carregando dados reais de votação nominal...
                      </div>
                    ) : null}

                    {inspectedVoteError ? (
                      <div className="vc-panel space-y-3">
                        <div className="flex items-start gap-2 text-sm text-[color:var(--danger-ink)]">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{inspectedVoteError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => retryInspectionDataLoad(inspectedProposicao.id)}
                          className={buttonStyles({ variant: "secondary", size: "sm" })}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : null}

                    {!isLoadingInspectedVoteData && !inspectedVoteError && inspectedVoteData ? (
                      <div className="space-y-4">
                        {voteBreakdown.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[color:var(--ink)]">Resultado geral da votação nominal</p>
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
                                      Valores fora do padrao: {bucket.rawValues.join(", ")}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                            Dados detalhados de resultado nominal indisponiveis para esta proposicao.
                          </div>
                        )}

                        {partyBreakdown.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[color:var(--ink)]">Distribuição por partido</p>
                            <div className="overflow-hidden rounded-2xl border border-[color:rgba(183,199,193,0.5)]">
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
                                  {partyBreakdown.slice(0, MAX_PARTY_ROWS).map((row) => (
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
                            {partyBreakdown.length > MAX_PARTY_ROWS ? (
                              <p className="text-xs text-[color:var(--ink-soft)]">
                                + {partyBreakdown.length - MAX_PARTY_ROWS} partidos adicionais disponíveis na fonte.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                            Sem agregação por partido para esta proposição.
                          </div>
                        )}

                        {individualDeputyVotes.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[color:var(--ink)]">Quem votou (amostra)</p>
                            <div className="overflow-hidden rounded-2xl border border-[color:rgba(183,199,193,0.5)]">
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
                                  {individualDeputyVotes.slice(0, MAX_INDIVIDUAL_VOTES_ROWS).map((vote) => (
                                    <tr key={`${vote.parlamentarId}-${vote.voto}`}>
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
                            {individualDeputyVotes.length > MAX_INDIVIDUAL_VOTES_ROWS ? (
                              <p className="text-xs text-[color:var(--ink-soft)]">
                                Mostrando {MAX_INDIVIDUAL_VOTES_ROWS} de {individualDeputyVotes.length} votos nominais disponíveis.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="vc-panel text-sm text-[color:var(--ink-muted)]">
                            Dados de votos individuais indisponiveis para esta proposição.
                          </div>
                        )}

                        {!inspectedVoteData.availableData.groupedHistoricalVotes ? (
                          <p className="text-xs leading-6 text-[color:var(--ink-soft)]">
                            Histórico agrupado por sessão/fase não está disponível nesta fonte atual.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelection(inspectedProposicao.id)}
                      className={buttonStyles({
                        variant: selectedSet.has(inspectedProposicao.id) ? "secondary" : "primary",
                        size: "md",
                        className: selectedSet.has(inspectedProposicao.id)
                          ? "border-[color:rgba(176,57,38,0.18)] text-[color:var(--danger-ink)]"
                          : undefined,
                      })}
                    >
                      {selectedSet.has(inspectedProposicao.id) ? "Remover do Meu Match" : "Adicionar ao Meu Match"}
                    </button>
                    <a
                      href={inspectedProposicao.urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonStyles({ variant: "secondary", size: "md" })}
                    >
                      Abrir ficha oficial
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Vote}
                  title="Selecione uma proposição"
                  description="Use o botão Inspecionar na lista para abrir detalhes e decidir se o item entra no seu Meu Match."
                />
              )}
            </SurfaceCard>
          </div>
        )}
      </SurfaceCard>

      {selectedProposicoes.length > 0 ? (
        <SurfaceCard className="space-y-3 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">Sua lista pronta para o Meu Match</h2>
            <Link href="/simulador/resultado" className={buttonStyles({ variant: "primary", size: "md" })}>
              Votar no Meu Match
            </Link>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {selectedProposicoes.slice(0, 6).map((proposicao) => (
              <li key={proposicao.id} className="vc-panel flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">{proposicao.numOficial}</p>
                  <p className="text-sm text-[color:var(--ink-muted)]">{proposicao.categoria}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSelection(proposicao.id)}
                  className={buttonStyles({
                    variant: "ghost",
                    size: "sm",
                    className: "border border-transparent text-[color:var(--danger-ink)] hover:border-[color:rgba(176,57,38,0.2)]",
                  })}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          {selectedProposicoes.length > 6 ? (
            <p className="text-sm text-[color:var(--ink-soft)]">
              + {selectedProposicoes.length - 6} proposições adicionais já salvas.
            </p>
          ) : null}
        </SurfaceCard>
      ) : null}
    </div>
  );
}
