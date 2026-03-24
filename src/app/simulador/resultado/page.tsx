"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Trophy, Users } from "lucide-react";
import { Badge, EmptyState, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";
import { formatPercent } from "@/lib/utils";

type RankingItem = {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  pontos: number;
  amostra: number;
};

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
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasVotes, setHasVotes] = useState(true);

  useEffect(() => {
    const runEngine = async () => {
      const votosRaw = localStorage.getItem("votosMatch");
      if (!votosRaw) {
        setHasVotes(false);
        setLoading(false);
        return;
      }

      try {
        const votos = JSON.parse(votosRaw);
        const res = await fetch("/api/calc-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ votosCidadao: votos }),
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
      } finally {
        setLoading(false);
      }
    };

    runEngine();
  }, []);

  if (loading) {
    return (
      <SurfaceCard className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Calculando seu match</h1>
          <p className="max-w-md text-sm leading-6 text-[color:var(--ink-muted)]">
            Cruzando suas respostas com os registros de votação disponíveis.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  if (!hasVotes) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Seu match aparece depois da simulação"
        description="Ainda não encontramos votos salvos neste navegador. Passe pelas votações simplificadas para gerar o ranking de afinidade."
        action={
          <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "md" })}>
            Iniciar votações
          </Link>
        }
      />
    );
  }

  if (errorMsg) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Não foi possível calcular o match"
        description={errorMsg}
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/simulador" className={buttonStyles({ variant: "secondary", size: "md" })}>
              Refazer simulação
            </Link>
            <button
              type="button"
              onClick={() => localStorage.removeItem("votosMatch")}
              className={buttonStyles({ variant: "ghost", size: "md" })}
            >
              Limpar respostas locais
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-6 sm:p-8">
        <SectionIntro
          eyebrow="Meu Match"
          title="Deputados mais alinhados com suas respostas"
          description="O ranking abaixo compara seus votos com decisões reais em plenário. Use o resultado como ponto de partida e abra os perfis para verificar contexto, projetos e despesas."
          action={
            <Link href="/simulador" className={buttonStyles({ variant: "secondary", size: "md" })}>
              Refazer votação
            </Link>
          }
          className="mb-0"
        />
      </SurfaceCard>

      <div className="space-y-4">
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
    </div>
  );
}
