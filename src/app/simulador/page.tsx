"use client";

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ExternalLink, Keyboard, Layers, List, Loader2, Search, Sparkles, Vote, X } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { Badge, EmptyState, MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getCachedSimuladorCards, type SimuladorCard } from "@/lib/simulador-cache";

type VoteValue = "SIM" | "NAO" | "PULAR";
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

const voteStatusLabel: Record<VoteValue, string> = {
  SIM: "Concordou",
  NAO: "Discordou",
  PULAR: "Pulou",
};

const voteStatusTone: Record<VoteValue, "success" | "danger" | "neutral"> = {
  SIM: "success",
  NAO: "danger",
  PULAR: "neutral",
};

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
  const [historicoVotos, setHistoricoVotos] = useState<{ proposicaoId: number; voto: VoteValue }[]>([]);
  const [viewMode, setViewMode] = useState<"guided" | "browse">("guided");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [totalProposicoes, setTotalProposicoes] = useState(0);
  const [pendingVoteIds, setPendingVoteIds] = useState<number[]>([]);
  const [visibleBrowseCount, setVisibleBrowseCount] = useState(INITIAL_BROWSE_RENDER_COUNT);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    let active = true;

    getCachedSimuladorCards(fetchSimuladorCards)
      .then((data) => {
        if (!active) return;

        startTransition(() => {
          setProposicoes(data);
          setTotalProposicoes(data.length);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error("Falha ao preparar simulador", error);
        if (active) {
          setProposicoes([]);
          setTotalProposicoes(0);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  const votosPorProposicao = useMemo(
    () => new Map(historicoVotos.map(({ proposicaoId, voto }) => [proposicaoId, voto])),
    [historicoVotos]
  );
  const proposicoesVisiveis = useMemo(
    () => (showOnlyActive ? proposicoes.filter((proposicao) => !isInactiveStatus(proposicao.statusDescricao)) : proposicoes),
    [proposicoes, showOnlyActive]
  );
  const proposicoesPendentesTotais = useMemo(
    () => proposicoes.filter((proposicao) => !votosPorProposicao.has(proposicao.id)),
    [proposicoes, votosPorProposicao]
  );
  const proposicoesPendentes = useMemo(
    () => proposicoesVisiveis.filter((proposicao) => !votosPorProposicao.has(proposicao.id)),
    [proposicoesVisiveis, votosPorProposicao]
  );
  const votosRealizados = historicoVotos.length;
  const canGenerateMatch = votosRealizados > 0;
  const isFinished = !loading && totalProposicoes > 0 && proposicoesPendentesTotais.length === 0;
  const currentProposicao = proposicoesPendentes[proposicoesPendentes.length - 1] ?? null;
  const progresso = totalProposicoes === 0 ? 0 : Math.round((votosRealizados / totalProposicoes) * 100);
  const remainingCount = proposicoesPendentes.length;
  const voteActionBase =
    "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-[22px] border px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] active:translate-y-px sm:text-base";
  const disagreeButtonClass =
    `${voteActionBase} border-[color:rgba(176,57,38,0.24)] bg-[linear-gradient(180deg,rgba(255,247,245,0.98),rgba(255,240,236,0.98))] text-[color:var(--danger-ink)] shadow-[0_18px_34px_-28px_rgba(176,57,38,0.42)] hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,241,237,1),rgba(255,232,227,1))]`;
  const skipButtonClass =
    `${voteActionBase} border-[color:var(--border-strong)] bg-white text-[color:var(--ink)] shadow-[0_18px_34px_-28px_rgba(16,42,37,0.18)] hover:-translate-y-0.5 hover:border-[color:rgba(13,107,100,0.18)] hover:bg-[color:rgba(255,255,255,0.98)]`;
  const agreeButtonClass =
    `${voteActionBase} border-[color:rgba(12,141,103,0.24)] bg-[linear-gradient(180deg,rgba(241,252,248,0.98),rgba(230,248,241,0.98))] text-[color:var(--success-ink)] shadow-[0_18px_34px_-28px_rgba(12,141,103,0.35)] hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(234,250,244,1),rgba(222,245,236,1))]`;
  const directoryVoteActionBase =
    "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[18px] border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] active:translate-y-px";
  const directoryDisagreeButtonClass =
    `${directoryVoteActionBase} border-[color:rgba(176,57,38,0.2)] bg-[color:rgba(255,248,246,0.98)] text-[color:var(--danger-ink)] shadow-[0_14px_24px_-22px_rgba(176,57,38,0.28)] hover:border-[color:rgba(176,57,38,0.28)] hover:bg-[color:rgba(255,243,240,1)]`;
  const directorySkipButtonClass =
    `${directoryVoteActionBase} border-[color:var(--border)] bg-white text-[color:var(--ink)] shadow-[0_14px_24px_-22px_rgba(16,42,37,0.14)] hover:border-[color:var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.98)]`;
  const directoryAgreeButtonClass =
    `${directoryVoteActionBase} border-[color:rgba(12,141,103,0.2)] bg-[color:rgba(243,251,247,0.98)] text-[color:var(--success-ink)] shadow-[0_14px_24px_-22px_rgba(12,141,103,0.24)] hover:border-[color:rgba(12,141,103,0.28)] hover:bg-[color:rgba(236,249,242,1)]`;

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

  const setVotingMode = (mode: "guided" | "browse") => {
    setViewMode(mode);
    setVisibleBrowseCount(INITIAL_BROWSE_RENDER_COUNT);
    if (mode === "guided") {
      setSearchTerm("");
    }
  };

  useEffect(() => {
    if (historicoVotos.length > 0) {
      localStorage.setItem("votosMatch", JSON.stringify(historicoVotos));
    }
  }, [historicoVotos]);

  const handleVote = useCallback(
    (id: number, voto: VoteValue) => {
      if (votosPorProposicao.has(id) || pendingVoteIds.includes(id)) {
        return;
      }

      setPendingVoteIds((prev) => [...prev, id]);

      setTimeout(() => {
        setHistoricoVotos((prev) =>
          prev.some((item) => item.proposicaoId === id) ? prev : [...prev, { proposicaoId: id, voto }]
        );
        setPendingVoteIds((prev) => prev.filter((currentId) => currentId !== id));
      }, 200);
    },
    [pendingVoteIds, votosPorProposicao]
  );

  useEffect(() => {
    if (loading || isFinished || viewMode !== "guided" || isMobileViewport || !currentProposicao) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleVote(currentProposicao.id, "NAO");
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        handleVote(currentProposicao.id, "SIM");
      } else if (
        event.key === "ArrowDown" ||
        event.key.toLowerCase() === "s" ||
        event.key === " "
      ) {
        event.preventDefault();
        handleVote(currentProposicao.id, "PULAR");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentProposicao, handleVote, isFinished, isMobileViewport, loading, viewMode]);

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
          <SectionIntro
            eyebrow="Votações simplificadas"
            title="Como você votaria em proposições reais?"
            description="Responda uma proposição por vez ou busque temas específicos. Suas respostas entram no cálculo do match."
            action={
              <Link href="/simulador/resultado" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                Ver meu match
              </Link>
            }
            className="mb-0"
          />

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile
              icon={Vote}
              label="Sessão atual"
              value={`${votosRealizados} resposta${votosRealizados === 1 ? "" : "s"}`}
              description="Registre concordo, discordo ou pular em cada proposição."
              tone="primary"
            />
            <MetricTile
              icon={Sparkles}
              label="Progresso"
              value={`${progresso}%`}
              description="As respostas ficam salvas localmente até o cálculo do ranking."
              tone="success"
            />
            <MetricTile
              icon={Layers}
              label="Fila restante"
              value={remainingCount}
              description="Proposições ainda disponíveis para esta sessão."
              tone="neutral"
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="relative overflow-hidden p-4 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-6 h-40 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.12),transparent_70%)] blur-3xl"
        />

        {loading ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[color:var(--ink)]">Preparando as votações</h2>
              <p className="max-w-md text-sm leading-6 text-[color:var(--ink-muted)]">
                Carregando a base de proposições uma vez para deixar a navegação seguinte mais rápida.
              </p>
            </div>
          </div>
        ) : totalProposicoes === 0 ? (
          <EmptyState
            icon={List}
            title="Nenhuma proposição disponível"
            description="A sessão atual não retornou proposições para votação. Tente novamente em instantes."
          />
        ) : isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[560px] flex-col items-center justify-center gap-6 text-center"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-[color:rgba(15,118,110,0.18)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
              <Sparkles className="h-9 w-9" />
            </span>
            <div className="space-y-3">
              <h2 className="font-display text-4xl font-semibold text-[color:var(--ink)]">
                Simulação concluída
              </h2>
              <p className="mx-auto max-w-lg text-base leading-7 text-[color:var(--ink-muted)]">
                Suas respostas já foram salvas localmente. Agora você pode calcular o ranking de afinidade com deputados federais.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/simulador/resultado" className={buttonStyles({ variant: "primary", size: "lg" })}>
                Calcular meu match
              </Link>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("votosMatch");
                  window.location.reload();
                }}
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                Refazer simulação
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex rounded-full border border-[color:var(--border)] bg-white p-1">
                  <button
                    type="button"
                    aria-pressed={viewMode === "guided"}
                    onClick={() => setVotingMode("guided")}
                    className={cn(
                      "min-h-10 rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                      viewMode === "guided"
                        ? "bg-[color:var(--accent)] text-white"
                        : "text-[color:var(--ink-muted)] hover:bg-[color:rgba(13,107,100,0.06)] hover:text-[color:var(--ink)]"
                    )}
                  >
                    Modo guiado
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === "browse"}
                    onClick={() => setVotingMode("browse")}
                    className={cn(
                      "min-h-10 rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                      viewMode === "browse"
                        ? "bg-[color:var(--accent)] text-white"
                        : "text-[color:var(--ink-muted)] hover:bg-[color:rgba(13,107,100,0.06)] hover:text-[color:var(--ink)]"
                    )}
                  >
                    Buscar e explorar
                  </button>
                </div>

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
                    Oculta itens arquivados, retirados ou já convertidos em resultado final.
                  </p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                    {viewMode === "guided" ? "Vote em uma proposição por vez" : "Explore proposições antes de votar"}
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-muted)]">
                    {viewMode === "guided"
                      ? isMobileViewport
                        ? "Deslize o cartão ou use os botões para registrar sua decisão."
                        : "Use os botões ou o teclado para votar nesta proposição."
                      : "Pesquise a base completa e vá carregando mais resultados conforme precisar."}
                  </p>
                </div>
              </div>

              <div className="vc-panel flex min-w-0 flex-col gap-3 xl:min-w-[320px]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[color:var(--ink-muted)]">Progresso da sessão</p>
                  <Badge tone="primary">{votosRealizados} de {totalProposicoes} respondidas</Badge>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))] transition-[width] duration-300"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                {canGenerateMatch ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[color:var(--ink-soft)]">
                      {votosRealizados} respostas registradas. O match pode ser calculado agora e continuará considerando os próximos votos.
                    </p>
                    <Link href="/simulador/resultado" className={buttonStyles({ variant: "primary", size: "sm" })}>
                      Gerar meu match
                    </Link>
                  </div>
                ) : null}
                {!isMobileViewport && viewMode === "guided" ? (
                  <p className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-soft)]">
                    <Keyboard className="h-4 w-4" />
                    Atalhos: A ou seta esquerda discorda, D ou seta direita concorda, S ou espaco pula.
                  </p>
                ) : null}
              </div>
            </div>

            <div key={viewMode}>
              {viewMode === "guided" ? (
                isMobileViewport ? (
                <div className="mx-auto flex w-full max-w-[26rem] flex-col items-center gap-4">
                  <div className="relative flex h-[32rem] w-full items-center justify-center overflow-hidden rounded-[30px] border border-[color:rgba(183,199,193,0.5)] bg-[color:rgba(248,247,242,0.96)] px-3 py-4">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-5 bottom-4 top-6 rounded-[30px] border border-[color:rgba(183,199,193,0.38)] bg-[color:rgba(246,248,246,1)]"
                    />
                    <AnimatePresence mode="wait">
                      {currentProposicao ? (
                        <SwipeCard
                          key={currentProposicao.id}
                          proposicao={currentProposicao}
                          onVote={handleVote}
                          enableDrag
                        />
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
                ) : currentProposicao ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <SurfaceCard className="min-w-0 space-y-5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{currentProposicao.numOficial}</Badge>
                      <Badge tone="neutral">{currentProposicao.categoria}</Badge>
                      <Badge tone="neutral">
                        Proposição {votosRealizados + 1} de {totalProposicoes}
                      </Badge>
                      {currentProposicao.statusDescricao ? (
                        <Badge tone="neutral">{currentProposicao.statusDescricao}</Badge>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                        {currentProposicao.titulo}
                      </h3>
                      {hasSummary(currentProposicao.resumoCidadao, currentProposicao.titulo) ? (
                        <p className="text-base leading-7 text-[color:var(--ink-muted)]">
                          {currentProposicao.resumoCidadao}
                        </p>
                      ) : null}
                      <a
                        href={currentProposicao.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonStyles({ variant: "secondary", size: "sm", className: "w-fit" })}
                      >
                        Ler na Câmara
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[color:rgba(183,199,193,0.5)] pt-5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleVote(currentProposicao.id, "NAO")}
                        className={disagreeButtonClass}
                      >
                        <X className="h-4 w-4" />
                        Discordo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(currentProposicao.id, "PULAR")}
                        className={cn(skipButtonClass, "sm:min-w-[160px]")}
                      >
                        Pular
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(currentProposicao.id, "SIM")}
                        className={agreeButtonClass}
                      >
                        <Check className="h-4 w-4" />
                        Concordo
                      </button>
                    </div>
                  </SurfaceCard>

                  <div className="space-y-4">
                    <MetricTile
                      icon={Vote}
                      label="Restantes"
                      value={remainingCount}
                      description="Proposições ainda aguardando resposta nesta sessão."
                      tone="primary"
                    />
                    <MetricTile
                      icon={List}
                      label="Busca direta"
                      value="Mudar de modo"
                      description="Use Buscar e explorar para localizar um tema específico antes de votar."
                      tone="neutral"
                    />
                  </div>
                </div>
                ) : (
                <EmptyState
                  icon={List}
                  title="Nenhuma proposição com o filtro atual"
                  description="Ative todas as proposições para incluir itens arquivados, retirados ou concluídos no fluxo guiado."
                  action={
                    showOnlyActive ? (
                      <button
                        type="button"
                        onClick={() => setShowOnlyActive(false)}
                        className={buttonStyles({ variant: "secondary", size: "md" })}
                      >
                        Mostrar todas
                      </button>
                    ) : undefined
                  }
                />
                )
              ) : (
              <div className="space-y-4">
                <SurfaceCard className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-[color:var(--ink)]">Diretório de proposições</h3>
                      <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                        Pesquise todas as proposições disponíveis no banco, abra a ficha oficial e vote direto na lista.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">
                        {totalProposicoes} na base
                      </Badge>
                      <Badge tone="primary">
                        {proposicoesFiltradas.length} visíve{proposicoesFiltradas.length === 1 ? "l" : "is"}
                      </Badge>
                      <Badge tone="neutral">
                        {remainingCount} pendente{remainingCount === 1 ? "" : "s"}
                      </Badge>
                    </div>
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
                      {proposicoesFiltradas.length === 1 ? "" : "s"} encontrados na base.
                    </p>
                    {searchTerm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setVisibleBrowseCount(INITIAL_BROWSE_RENDER_COUNT);
                        }}
                        className={buttonStyles({ variant: "ghost", size: "sm" })}
                      >
                        Limpar busca
                      </button>
                    ) : null}
                  </div>
                </SurfaceCard>

                {proposicoesFiltradas.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="Nenhuma proposição encontrada"
                    description="Ajuste o termo pesquisado para localizar outra proposição da base ou volte ao modo guiado para continuar uma por vez."
                  />
                ) : (
                  <SurfaceCard className="overflow-hidden p-0">
                    <ul
                      aria-label="Diretório de proposições disponíveis para votar"
                      className="divide-y divide-[color:rgba(183,199,193,0.5)]"
                    >
                      {proposicoesExibidas.map((proposicao) => {
                        const votoRegistrado = votosPorProposicao.get(proposicao.id);
                        const isVotePending = pendingVoteIds.includes(proposicao.id);
                        const canVoteFromList = !votoRegistrado && !isVotePending;

                        return (
                          <li key={proposicao.id} className="px-4 py-5 sm:px-5 sm:py-6">
                            <article className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center lg:gap-5">
                              <div className="min-w-0 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge tone="primary">{proposicao.categoria}</Badge>
                                  <Badge tone="neutral">{proposicao.numOficial}</Badge>
                                  {proposicao.statusDescricao ? (
                                    <Badge tone="neutral">{proposicao.statusDescricao}</Badge>
                                  ) : null}
                                  {votoRegistrado ? (
                                    <Badge tone={voteStatusTone[votoRegistrado]}>
                                      Sua resposta: {voteStatusLabel[votoRegistrado]}
                                    </Badge>
                                  ) : isVotePending ? (
                                    <Badge tone="neutral">Registrando voto...</Badge>
                                  ) : (
                                    <Badge tone="neutral">Pendente</Badge>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <h3 className="text-lg font-semibold leading-7 text-[color:var(--ink)]">
                                    {proposicao.titulo}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--ink-muted)]">
                                    <span>Proposição oficial</span>
                                    <a
                                      href={proposicao.urlOficial}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-medium text-[color:var(--accent-strong)] hover:text-[color:var(--accent)]"
                                    >
                                      Ler na Câmara
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                  {hasSummary(proposicao.resumoCidadao, proposicao.titulo) ? (
                                    <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                                      {proposicao.resumoCidadao}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              {canVoteFromList ? (
                                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleVote(proposicao.id, "NAO")}
                                    className={directoryDisagreeButtonClass}
                                  >
                                    <X className="h-4 w-4" />
                                    Discordo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVote(proposicao.id, "PULAR")}
                                    className={cn(directorySkipButtonClass, "sm:max-w-[140px]")}
                                  >
                                    Pular
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVote(proposicao.id, "SIM")}
                                    className={directoryAgreeButtonClass}
                                  >
                                    <Check className="h-4 w-4" />
                                    Concordo
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-start lg:justify-end">
                                  {votoRegistrado ? (
                                    <Badge tone={voteStatusTone[votoRegistrado]} className="min-h-11 px-4 text-sm">
                                      {voteStatusLabel[votoRegistrado]}
                                    </Badge>
                                  ) : (
                                    <Badge tone="neutral" className="min-h-11 px-4 text-sm">
                                      Registrando voto...
                                    </Badge>
                                  )}
                                </div>
                              )}
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
                            setVisibleBrowseCount((current) =>
                              Math.min(current + BROWSE_RENDER_STEP, proposicoesFiltradas.length)
                            )
                          }
                          className={buttonStyles({ variant: "secondary", size: "md", className: "w-full" })}
                        >
                          Mostrar mais {Math.min(BROWSE_RENDER_STEP, proposicoesFiltradas.length - proposicoesExibidas.length)} proposições
                        </button>
                      </div>
                    ) : null}
                  </SurfaceCard>
                )}
              </div>
              )}
            </div>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
