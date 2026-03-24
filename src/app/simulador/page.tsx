"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Loader2, Sparkles, Vote } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { getProposicoesParaSimulador } from "./actions";

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

  useEffect(() => {
    getProposicoesParaSimulador().then((data) => {
      const propFormatadas = data.map((p) => ({
        id: p.id,
        apelidoIa: p.apelidoIa || p.ementaOficial,
        resumoCidadao: p.resumoCidadao || "Sem resumo processado pela IA.",
        categoria: p.categoria || "GERAL",
      }));
      setProposicoes(propFormatadas);
      setLoading(false);
    });
  }, []);

  const isFinished = !loading && proposicoes.length === 0;

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

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
          <SectionIntro
            eyebrow="Votações simplificadas"
            title="Como você votaria em proposições reais?"
            description="Arraste os cartões ou use os botões para concordar, discordar ou pular. No final, o app cruza suas respostas com registros públicos de votação e monta o seu match."
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
          <div className="flex min-h-[620px] flex-col items-center justify-center gap-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Vote em linguagem simples</h2>
              <p className="max-w-md text-sm leading-6 text-[color:var(--ink-muted)]">
                O cartão do topo é o ativo. Arraste lateralmente ou use os botões para registrar sua posição.
              </p>
            </div>

            <div className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[color:rgba(183,199,193,0.5)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(216,239,232,0.35))] px-4 py-8">
              <AnimatePresence mode="popLayout">
                {proposicoes.map((prop, index) => (
                  <SwipeCard
                    key={prop.id}
                    proposicao={prop}
                    onVote={handleVote}
                    isFront={index === proposicoes.length - 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
