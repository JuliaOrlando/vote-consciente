"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Keyboard, Layers, List, Loader2, Search, Sparkles, Vote, X } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { Badge, EmptyState, MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { getProposicoesParaSimulador } from "./actions";
import { cn } from "@/lib/utils";

type SimuladorCard = {
  id: number;
  apelidoIa: string;
  resumoCidadao: string;
  categoria: string;
};

export default function SimuladorPage() {
  const [proposicoes, setProposicoes] = useState<SimuladorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [votosRealizados, setVotosRealizados] = useState(0);
  const [historicoVotos, setHistoricoVotos] = useState<{ proposicaoId: number; voto: string }[]>([]);
  const [viewMode, setViewMode] = useState<"guided" | "browse">("guided");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [totalProposicoes, setTotalProposicoes] = useState(0);

  useEffect(() => {
    getProposicoesParaSimulador().then((data) => {
      const propFormatadas = data.map((p) => ({
        id: p.id,
        apelidoIa: p.apelidoIa || p.ementaOficial,
        resumoCidadao: p.resumoCidadao || "Sem resumo processado pela IA.",
        categoria: p.categoria || "GERAL",
      }));
      setProposicoes(propFormatadas);
      setTotalProposicoes(propFormatadas.length);
      setLoading(false);
    });
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

  const isFinished = !loading && proposicoes.length === 0;
  const currentProposicao = proposicoes[proposicoes.length - 1] ?? null;
  const progresso = totalProposicoes === 0 ? 0 : Math.round((votosRealizados / totalProposicoes) * 100);

  const proposicoesFiltradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [...proposicoes].reverse();

    return [...proposicoes]
      .reverse()
      .filter((proposicao) =>
        `${proposicao.apelidoIa} ${proposicao.resumoCidadao} ${proposicao.categoria}`
          .toLowerCase()
          .includes(term)
      );
  }, [proposicoes, searchTerm]);

  useEffect(() => {
    if (isFinished && historicoVotos.length > 0) {
      localStorage.setItem("votosMatch", JSON.stringify(historicoVotos));
    }
  }, [historicoVotos, isFinished]);

  const handleVote = (id: number, voto: "SIM" | "NAO" | "PULAR") => {
    setHistoricoVotos((prev) => [...prev, { proposicaoId: id, voto }]);

    setTimeout(() => {
      setProposicoes((prev) => prev.filter((p) => p.id !== id));
      setVotosRealizados((prev) => prev + 1);
    }, 200);
  };

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
  }, [currentProposicao, isFinished, isMobileViewport, loading, viewMode]);

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
          <SectionIntro
            eyebrow="Votações simplificadas"
            title="Como você votaria em proposições reais?"
            description="No celular você pode usar o gesto de swipe. Em telas maiores, a interação principal é por clique, com uma proposição por vez e leitura mais estável."
            action={
              <Link href="/simulador/resultado" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                Ver meu match
              </Link>
            }
            className="mb-0"
          />

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricTile
              icon={Vote}
              label="Fluxo simples"
              value="Concordo, discordo ou pulo"
              description="A interface foi reduzida ao essencial para facilitar decisão em telas pequenas."
              tone="primary"
            />
            <MetricTile
              icon={Sparkles}
              label="Progresso"
              value={`${votosRealizados} voto${votosRealizados === 1 ? "" : "s"}`}
              description="As respostas ficam salvas localmente até o cálculo do ranking."
              tone="success"
            />
            <MetricTile
              icon={Layers}
              label="Base usada"
              value="Proposições reais"
              description="Os cartões são carregados da base da aplicação sem mexer no algoritmo de match."
              tone="neutral"
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="relative overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-x-6 top-6 h-40 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.12),transparent_70%)] blur-3xl" />

        {loading ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[color:var(--ink)]">Preparando as votações</h2>
              <p className="max-w-md text-sm leading-6 text-[color:var(--ink-muted)]">
                Buscando proposições da base atual para iniciar a simulação.
              </p>
            </div>
          </div>
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
                    onClick={() => setViewMode("guided")}
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
                    onClick={() => setViewMode("browse")}
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

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                    {viewMode === "guided" ? "Vote em uma proposição por vez" : "Explore proposições antes de votar"}
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-muted)]">
                    {viewMode === "guided"
                      ? isMobileViewport
                        ? "No celular, o gesto de swipe continua disponível. Os botões também registram a decisão."
                        : "No desktop, a interface prioriza leitura, botões claros e atalhos de teclado."
                      : "Pesquise por tema, tipo ou resumo e registre o voto diretamente na lista sem mudar o fluxo do match."}
                  </p>
                </div>
              </div>

              <div className="vc-panel flex min-w-0 flex-col gap-3 lg:min-w-[320px]">
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
                {!isMobileViewport && viewMode === "guided" ? (
                  <p className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-soft)]">
                    <Keyboard className="h-4 w-4" />
                    Atalhos: `A`/seta esquerda discorda, `D`/seta direita concorda, `S` ou espaço pula.
                  </p>
                ) : null}
              </div>
            </div>

            {viewMode === "guided" ? (
              isMobileViewport ? (
                <div className="flex min-h-[620px] flex-col items-center justify-center gap-6">
                  <div className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[color:rgba(183,199,193,0.5)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(216,239,232,0.35))] px-4 py-8">
                    <AnimatePresence mode="popLayout">
                      {proposicoes.map((prop, index) => (
                        <SwipeCard
                          key={prop.id}
                          proposicao={prop}
                          onVote={handleVote}
                          isFront={index === proposicoes.length - 1}
                          enableDrag
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ) : currentProposicao ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <SurfaceCard className="min-w-0 space-y-5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{currentProposicao.categoria}</Badge>
                      <Badge tone="neutral">
                        Proposição {votosRealizados + 1} de {totalProposicoes}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                        {currentProposicao.apelidoIa}
                      </h3>
                      <p className="text-base leading-7 text-[color:var(--ink-muted)]">
                        {currentProposicao.resumoCidadao}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[color:rgba(183,199,193,0.5)] pt-5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleVote(currentProposicao.id, "NAO")}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(176,57,38,0.22)] bg-[color:rgba(176,57,38,0.08)] px-5 text-sm font-semibold text-[color:var(--danger-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(176,57,38,0.12)]"
                      >
                        <X className="h-4 w-4" />
                        Discordo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(currentProposicao.id, "PULAR")}
                        className={buttonStyles({ variant: "secondary", size: "lg", className: "sm:min-w-[150px]" })}
                      >
                        Pular
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(currentProposicao.id, "SIM")}
                        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(12,141,103,0.22)] bg-[color:rgba(12,141,103,0.08)] px-5 text-sm font-semibold text-[color:var(--success-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(12,141,103,0.12)]"
                      >
                        <Check className="h-4 w-4" />
                        Concordo
                      </button>
                    </div>
                  </SurfaceCard>

                  <div className="space-y-4">
                    <MetricTile
                      icon={Vote}
                      label="Interação principal"
                      value="Clique ou teclado"
                      description="O desktop não depende de swipe. As ações ficam sempre visíveis."
                      tone="primary"
                    />
                    <MetricTile
                      icon={List}
                      label="Próximo passo"
                      value="Modo de busca"
                      description="Se quiser comparar temas antes de votar, troque para buscar e explorar."
                      tone="neutral"
                    />
                  </div>
                </div>
              ) : null
            ) : (
              <div className="space-y-4">
                <SurfaceCard className="space-y-4 p-5 sm:p-6">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar por tema, categoria ou resumo da proposição"
                      className="vc-input pl-12"
                    />
                  </div>
                  <p className="text-sm text-[color:var(--ink-muted)]">
                    {proposicoesFiltradas.length} proposição{proposicoesFiltradas.length === 1 ? "" : "ões"} disponível{proposicoesFiltradas.length === 1 ? "" : "is"} nesta sessão.
                  </p>
                </SurfaceCard>

                {proposicoesFiltradas.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="Nenhuma proposição encontrada"
                    description="Tente ajustar o termo pesquisado ou volte ao modo guiado para continuar votando uma a uma."
                  />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {proposicoesFiltradas.map((proposicao) => (
                      <SurfaceCard key={proposicao.id} className="space-y-4 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="primary">{proposicao.categoria}</Badge>
                          <Badge tone="neutral">ID {proposicao.id}</Badge>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-[color:var(--ink)]">{proposicao.apelidoIa}</h3>
                          <p className="text-sm leading-7 text-[color:var(--ink-muted)]">{proposicao.resumoCidadao}</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleVote(proposicao.id, "NAO")}
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(176,57,38,0.22)] bg-[color:rgba(176,57,38,0.08)] px-4 text-sm font-semibold text-[color:var(--danger-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(176,57,38,0.12)]"
                          >
                            <X className="h-4 w-4" />
                            Discordo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVote(proposicao.id, "PULAR")}
                            className={buttonStyles({ variant: "secondary", size: "md", className: "sm:min-w-[120px]" })}
                          >
                            Pular
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVote(proposicao.id, "SIM")}
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(12,141,103,0.22)] bg-[color:rgba(12,141,103,0.08)] px-4 text-sm font-semibold text-[color:var(--success-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(12,141,103,0.12)]"
                          >
                            <Check className="h-4 w-4" />
                            Concordo
                          </button>
                        </div>
                      </SurfaceCard>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
