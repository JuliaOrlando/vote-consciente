"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
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

const MATCH_SELECTION_STORAGE_KEY = "matchSelectedPropositions";
const INITIAL_BROWSE_RENDER_COUNT = 80;
const BROWSE_RENDER_STEP = 160;
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

export default function SimuladorPage() {
  const [proposicoes, setProposicoes] = useState<SimuladorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleBrowseCount, setVisibleBrowseCount] = useState(INITIAL_BROWSE_RENDER_COUNT);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [inspectedId, setInspectedId] = useState<number | null>(null);
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

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((currentId) => currentId !== id);
      }

      return [...prev, id];
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
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">Painel da sessão de votações</h2>
            <p className="text-sm text-[color:var(--ink-muted)]">
              Distribuição das categorias mais frequentes na base visível.
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

            <SurfaceCard as="aside" className="h-fit space-y-4 xl:sticky xl:top-4">
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
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[color:var(--ink)]">Quebra de contexto da base atual</p>
                    <div className="vc-panel space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--ink-muted)]">Mesmo status</span>
                        <span className="font-semibold text-[color:var(--ink)]">{relatedStatusCount}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]"
                          style={{
                            width: `${Math.max(
                              totalProposicoes === 0 ? 0 : (relatedStatusCount / totalProposicoes) * 100,
                              relatedStatusCount > 0 ? 8 : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs leading-6 text-[color:var(--ink-soft)]">
                      Votação nominal (quem votou e como votou) pode ser conferida na ficha oficial da Câmara para esta proposição.
                    </p>
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
