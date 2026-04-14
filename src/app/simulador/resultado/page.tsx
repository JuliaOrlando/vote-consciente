"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUp,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import { Badge, EmptyState, MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { useMatchSelection } from "@/hooks/useMatchSelection";
import { cn, formatPercent } from "@/lib/utils";
import { getCachedSimuladorCards, type SimuladorCard } from "@/lib/simulador-cache";

type VoteValue = "SIM" | "NAO" | "PULAR";

type RankingItem = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  pontos: number;
  amostra: number;
};

const MATCH_VOTES_STORAGE_KEY = "votosMatch";

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

function parseStoredVotes(value: string | null) {
  if (!value) return [] as Array<{ proposicaoId: number; voto: VoteValue }>;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        proposicaoId: Number(item?.proposicaoId),
        voto: item?.voto,
      }))
      .filter(
        (item) =>
          Number.isFinite(item.proposicaoId) &&
          (item.voto === "SIM" || item.voto === "NAO" || item.voto === "PULAR")
      ) as Array<{ proposicaoId: number; voto: VoteValue }>;
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

function MatchPhoto({ id, nome }: { id: number; nome: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[color:var(--accent-strong)]">
        <Users className="h-7 w-7" />
      </div>
    );
  }

  return (
    <Image
      src={`https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`}
      alt={`Foto de ${nome}`}
      fill
      sizes="56px"
      className="object-cover object-top"
      onError={() => setFailed(true)}
    />
  );
}

export default function ResultadoPage() {
  const [proposicoes, setProposicoes] = useState<SimuladorCard[]>([]);
  const [loadingProposicoes, setLoadingProposicoes] = useState(true);
  const [historicoVotos, setHistoricoVotos] = useState<Array<{ proposicaoId: number; voto: VoteValue }>>([]);
  const [activeProposicaoId, setActiveProposicaoId] = useState<number | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { selectedIds, removeSelection } = useMatchSelection();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setHistoricoVotos(parseStoredVotes(localStorage.getItem(MATCH_VOTES_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    let active = true;

    getCachedSimuladorCards(fetchSimuladorCards)
      .then((data) => {
        if (!active) return;
        setProposicoes(data);
      })
      .catch((error) => {
        console.error("Falha ao carregar proposições para Meu Match", error);
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

  const selectedProposicoes = useMemo(
    () => selectedIds.map((id) => proposicoes.find((proposicao) => proposicao.id === id)).filter(Boolean) as SimuladorCard[],
    [proposicoes, selectedIds]
  );

  useEffect(() => {
    if (historicoVotos.length === 0) {
      localStorage.removeItem(MATCH_VOTES_STORAGE_KEY);
      return;
    }

    localStorage.setItem(MATCH_VOTES_STORAGE_KEY, JSON.stringify(historicoVotos));
  }, [historicoVotos]);

  const votosPorProposicao = useMemo(
    () => new Map(historicoVotos.map(({ proposicaoId, voto }) => [proposicaoId, voto])),
    [historicoVotos]
  );

  const proposicoesPendentes = useMemo(
    () => selectedProposicoes.filter((proposicao) => !votosPorProposicao.has(proposicao.id)),
    [selectedProposicoes, votosPorProposicao]
  );
  const resolvedActiveProposicaoId = useMemo(() => {
    if (selectedProposicoes.length === 0) return null;

    if (
      activeProposicaoId !== null &&
      selectedProposicoes.some((proposicao) => proposicao.id === activeProposicaoId)
    ) {
      return activeProposicaoId;
    }

    return proposicoesPendentes[0]?.id ?? selectedProposicoes[0].id;
  }, [activeProposicaoId, proposicoesPendentes, selectedProposicoes]);

  const activeProposicao = useMemo(() => {
    if (resolvedActiveProposicaoId === null) return null;
    return selectedProposicoes.find((proposicao) => proposicao.id === resolvedActiveProposicaoId) ?? null;
  }, [resolvedActiveProposicaoId, selectedProposicoes]);

  const votosRealizados = historicoVotos.length;
  const totalSelecionadas = selectedProposicoes.length;
  const progresso = totalSelecionadas === 0 ? 0 : Math.round((votosRealizados / totalSelecionadas) * 100);
  const canCalculate = historicoVotos.some((item) => item.voto !== "PULAR");
  // Todos os itens selecionados já foram votados
  const allVoted = totalSelecionadas > 0 && proposicoesPendentes.length === 0;

  const handleVote = (id: number, voto: VoteValue) => {
    setErrorMsg("");
    setRanking([]);

    setHistoricoVotos((prev) => {
      const existingIndex = prev.findIndex((item) => item.proposicaoId === id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { proposicaoId: id, voto };
        return next;
      }

      return [...prev, { proposicaoId: id, voto }];
    });

    const temporaryVotesMap = new Map(votosPorProposicao);
    temporaryVotesMap.set(id, voto);
    const nextPending = selectedProposicoes.find((proposicao) => !temporaryVotesMap.has(proposicao.id));
    if (nextPending) {
      setActiveProposicaoId(nextPending.id);
    }
  };

  const removeFromSelection = (id: number) => {
    removeSelection(id);
    setHistoricoVotos((prev) => prev.filter((item) => item.proposicaoId !== id));
    setRanking([]);
    setErrorMsg("");
  };

  const clearSession = () => {
    setHistoricoVotos([]);
    setRanking([]);
    setErrorMsg("");
    localStorage.removeItem(MATCH_VOTES_STORAGE_KEY);
  };

  const calculateMatch = async () => {
    if (!canCalculate) return;

    setIsCalculating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/calc-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votosCidadao: historicoVotos }),
      });

      if (!res.ok) {
        const errorObj = await res.json();
        throw new Error(errorObj.error || "Falha do motor de similaridade");
      }

      const data = await res.json();
      setRanking(data.matches || []);
    } catch (error: unknown) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : String(error));
      setRanking([]);
    } finally {
      setIsCalculating(false);
    }
  };

  if (loadingProposicoes) {
    return (
      <SurfaceCard className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Preparando Meu Match</h1>
          <p className="max-w-md text-sm leading-6 text-[color:var(--ink-muted)]">
            Carregando sua lista salva para iniciar sua votação pessoal.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Seu Meu Match começa em Votações"
        description="Você ainda não adicionou proposições na sua lista pessoal. Explore votações, inspecione detalhes e salve os itens para votar aqui."
        action={
          <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "md" })}>
            Explorar Votações
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-6 sm:p-8">
        <SectionIntro
          eyebrow="Meu Match"
          title="Vote nas proposições que você selecionou"
          description="Agora esta área recebe sua opinião pessoal e executa a comparação com os votos reais dos deputados."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/simulador" className={buttonStyles({ variant: "secondary", size: "md" })}>
                Voltar para Votações
              </Link>
              <button
                type="button"
                onClick={clearSession}
                className={buttonStyles({ variant: "ghost", size: "md" })}
              >
                Limpar sessão
              </button>
            </div>
          }
          className="mb-0"
        />
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile
          icon={Vote}
          label="Selecionadas"
          value={totalSelecionadas}
          description="Proposições vindas da área de Votações."
          tone="neutral"
        />
        <MetricTile
          icon={CheckCircle2}
          label="Respondidas"
          value={votosRealizados}
          description="Itens com voto pessoal registrado nesta sessão."
          tone="primary"
        />
        <MetricTile
          icon={Sparkles}
          label="Progresso"
          value={`${progresso}%`}
          description="Avanço da sua votação pessoal antes do cálculo do match."
          tone="success"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <SurfaceCard className="flex min-w-0 flex-col p-5 sm:p-6 xl:min-h-[28rem]">
          {activeProposicao ? (
            <>
              <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
                <Badge tone="primary">{activeProposicao.numOficial}</Badge>
                <Badge tone="neutral">{activeProposicao.categoria}</Badge>
                <Badge tone="neutral">
                  {votosRealizados + (votosPorProposicao.has(activeProposicao.id) ? 0 : 1)} de {totalSelecionadas}
                </Badge>
                {activeProposicao.statusDescricao ? <Badge tone="neutral">{activeProposicao.statusDescricao}</Badge> : null}
              </div>

              <div className="mb-5 flex-1 space-y-3">
                <h2 className="font-display text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-[color:var(--ink)]">
                  {activeProposicao.titulo}
                </h2>
                {hasSummary(activeProposicao.resumoCidadao, activeProposicao.titulo) ? (
                  <p className="text-sm leading-6 text-[color:var(--ink-muted)]">{activeProposicao.resumoCidadao}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Link
                    href={`/simulador/proposicao/${activeProposicao.id}`}
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    Ver detalhes do projeto
                  </Link>
                  <a
                    href={activeProposicao.urlOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles({ variant: "ghost", size: "sm" })}
                  >
                    Ficha oficial da Câmara
                  </a>
                </div>
              </div>

              {/* Quando todos os itens foram votados, exibe banner de conclusão */}
              {allVoted ? (
                <div className="flex flex-col items-start gap-4 rounded-[20px] border border-[color:rgba(12,141,103,0.24)] bg-[linear-gradient(180deg,rgba(241,252,248,0.98),rgba(230,248,241,0.98))] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-[color:var(--ink)]">Todas as proposições respondidas!</p>
                      <p className="text-sm text-[color:var(--ink-muted)]">Você pode revisar suas respostas na fila ao lado ou calcular o match agora.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 border-t border-[color:rgba(183,199,193,0.5)] pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleVote(activeProposicao.id, "NAO")}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[20px] border border-[color:rgba(176,57,38,0.24)] bg-[linear-gradient(180deg,rgba(255,247,245,0.98),rgba(255,240,236,0.98))] px-5 text-sm font-semibold text-[color:var(--danger-ink)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,241,237,1),rgba(255,232,227,1))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] sm:text-base"
                  >
                    <X className="h-4 w-4" />
                    Discordo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(activeProposicao.id, "PULAR")}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[20px] border border-[color:var(--border-strong)] bg-white px-5 text-sm font-semibold text-[color:var(--ink)] transition-all hover:-translate-y-0.5 hover:border-[color:rgba(13,107,100,0.18)] hover:bg-[color:rgba(255,255,255,0.98)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] sm:text-base"
                  >
                    Pular
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(activeProposicao.id, "SIM")}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[20px] border border-[color:rgba(12,141,103,0.24)] bg-[linear-gradient(180deg,rgba(241,252,248,0.98),rgba(230,248,241,0.98))] px-5 text-sm font-semibold text-[color:var(--success-ink)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(234,250,244,1),rgba(222,245,236,1))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] sm:text-base"
                  >
                    <Check className="h-4 w-4" />
                    Concordo
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Vote}
              title="Sem proposições ativas"
              description="Todos os itens da sua lista atual foram removidos. Volte em Votações para selecionar novas proposições."
            />
          )}
        </SurfaceCard>

        <div className="relative flex h-full min-h-[460px] flex-col xl:min-h-0">
          <SurfaceCard className="flex flex-col p-4 sm:p-5 xl:absolute xl:inset-0">
            <div className="mb-4 shrink-0 space-y-2 border-b border-[color:var(--border)] pb-4">
              <h2 className="text-xl font-semibold text-[color:var(--ink)]">Fila do Meu Match</h2>
              <p className="text-sm text-[color:var(--ink-muted)]">
                Selecione um item para votar ou revisar sua resposta atual.
              </p>
            </div>

            <div className="vc-scroll-area flex-1 overflow-y-auto pr-2">
              <ul className="space-y-2">
            {selectedProposicoes.map((proposicao) => {
              const votoRegistrado = votosPorProposicao.get(proposicao.id);
              const isActive = resolvedActiveProposicaoId === proposicao.id;

              return (
                <li key={proposicao.id}>
                  <div
                    className={cn(
                      "rounded-2xl border px-3 py-3 transition-all",
                      isActive
                        ? "border-[color:rgba(13,107,100,0.25)] bg-[color:rgba(215,236,230,0.65)]"
                        : "border-[color:var(--border)] bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveProposicaoId(proposicao.id)}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <p className="text-sm font-semibold text-[color:var(--ink)]">{proposicao.numOficial}</p>
                        <p className="line-clamp-2 text-sm text-[color:var(--ink-muted)]">{proposicao.titulo}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromSelection(proposicao.id)}
                        className={buttonStyles({
                          variant: "ghost",
                          size: "sm",
                          className:
                            "min-h-9 border border-transparent px-2 text-[color:var(--danger-ink)] hover:border-[color:rgba(176,57,38,0.18)]",
                        })}
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {votoRegistrado ? (
                        <Badge tone={voteStatusTone[votoRegistrado]}>Sua resposta: {voteStatusLabel[votoRegistrado]}</Badge>
                      ) : (
                        <Badge tone="neutral">Pendente</Badge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
              </ul>
            </div>

            <div className="mt-4 shrink-0 border-t border-[color:rgba(183,199,193,0.5)] pt-4">
            <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-[color:rgba(159,179,171,0.28)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))] transition-[width] duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <button
              type="button"
              disabled={!canCalculate || isCalculating}
              onClick={calculateMatch}
              className={buttonStyles({ variant: "primary", size: "md", className: "w-full" })}
            >
              {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isCalculating ? "Calculando..." : "Calcular meu match"}
            </button>
            {!canCalculate ? (
              <p className="mt-2 text-xs text-[color:var(--ink-soft)]">
                Registre ao menos um voto SIM ou NAO para executar a comparação.
              </p>
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </div>

      {errorMsg ? (
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível calcular o match"
          description={errorMsg}
          action={
            <button type="button" onClick={calculateMatch} className={buttonStyles({ variant: "secondary", size: "md" })}>
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {ranking.length > 0 ? (
        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <SectionIntro
              eyebrow="Resultado"
              title="Deputados mais alinhados com suas respostas"
              description="Ranking calculado apenas com as proposições selecionadas e votos pessoais registrados no Meu Match."
              className="mb-0"
            />
          </SurfaceCard>

          {ranking.map((deputado, index) => (
            <Link key={deputado.id} href={`/deputado/${deputado.id}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SurfaceCard className="transition-all hover:-translate-y-0.5 hover:bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-sm font-semibold text-[color:var(--ink)]">
                      {index + 1}
                    </div>

                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[color:rgba(15,118,110,0.18)] bg-[color:var(--accent-soft)]">
                      <MatchPhoto id={deputado.id} nome={deputado.nome} />
                      {index === 0 ? (
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent)] text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-[color:var(--ink)]">{deputado.nome}</h2>
                          <p className="text-sm text-[color:var(--ink-muted)]">
                            {deputado.partido} · {deputado.uf}
                          </p>
                        </div>
                        <Badge tone={index === 0 ? "success" : deputado.pontos >= 50 ? "warning" : "neutral"}>
                          {index === 0 ? (
                            <>
                              <Trophy className="h-3.5 w-3.5" />
                              Melhor correspondência
                            </>
                          ) : (
                            "Perfil comparável"
                          )}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-display text-3xl font-semibold text-[color:var(--ink)]">
                        {formatPercent(deputado.pontos, 0)}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                        Afinidade
                      </p>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : null}

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-28 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] md:bottom-10 md:left-28"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
