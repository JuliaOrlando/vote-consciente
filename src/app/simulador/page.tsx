"use client";

import { useState, useEffect } from "react";
import { SwipeCard } from "@/components/SwipeCard";
import { ChevronLeft, Flame, Layers, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getProposicoesParaSimulador } from "./actions";

export default function SimuladorPage() {
    const [proposicoes, setProposicoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [votosRealizados, setVotosRealizados] = useState(0);
    const [historicoVotos, setHistoricoVotos] = useState<{ proposicaoId: number, voto: string }[]>([]);

    // Carrega dados Reais
    useEffect(() => {
        getProposicoesParaSimulador().then(data => {
            const propFormatadas = data.map(p => ({
                id: p.id,
                apelidoIa: p.apelidoIa || p.ementaOficial,
                resumoCidadao: p.resumoCidadao || "Sem resumo processado pela IA.",
                categoria: p.categoria || "GERAL"
            }));
            setProposicoes(propFormatadas);
            setLoading(false);
        });
    }, []);

    // Grava localmente ao encerrar os testes para enviar p/ o Engine Final de Match
    const isFinished = !loading && proposicoes.length === 0;

    useEffect(() => {
        if (isFinished && historicoVotos.length > 0) {
            localStorage.setItem("votosMatch", JSON.stringify(historicoVotos));
        }
    }, [isFinished, historicoVotos]);

    const handleVote = (id: number, voto: "SIM" | "NAO" | "PULAR") => {
        setHistoricoVotos(prev => [...prev, { proposicaoId: id, voto }]);

        // Pequeno atraso para a animação do card terminar de voar
        setTimeout(() => {
            setProposicoes(prev => prev.filter(p => p.id !== id));
            setVotosRealizados(prev => prev + 1);
        }, 200);
    };

    return (
        <div className="flex flex-col min-h-screen relative p-6 pb-12">
            {/* Header Interativo */}
            <header className="flex justify-between items-center mb-8 relative z-20">
                <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-400" />
                </Link>

                <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50">
                    <Flame className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-300">
                        {votosRealizados} votos registrados
                    </span>
                </div>
            </header>

            {/* Loading Box */}
            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    <p className="text-slate-400 font-medium">Buscando pautas reais no legislativo...</p>
                </div>
            )}

            {/* Título de Contexto */}
            {!isFinished && !loading && (
                <div className="text-center mb-8 relative z-20 space-y-2">
                    <h1 className="text-2xl font-bold font-display text-white">Como você votaria?</h1>
                    <p className="text-slate-400 text-sm">Arraste para a direita se Concorda, ou esquerda se Discorda.</p>
                </div>
            )}

            {/* Área da Stack de Cards */}
            {!loading && (
                <div className="flex-1 flex items-center justify-center relative w-full perspective-[1000px]">
                    <AnimatePresence mode="popLayout">
                        {proposicoes.map((prop, idx) => (
                            <SwipeCard
                                key={prop.id}
                                proposicao={prop}
                                onVote={handleVote}
                                isFront={idx === proposicoes.length - 1}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Cenas de quando acabar as PECs */}
                    {isFinished && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex justify-center items-center border border-emerald-500/30">
                                <Layers className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold font-display text-white mb-2">Simulação Concluída!</h2>
                                <p className="text-slate-400 max-w-xs">Você definiu sua posição em temas reais e impactantes. O simulador salvou suas respostas.</p>
                            </div>

                            <Link href="/simulador/resultado" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-slate-950 font-semibold rounded-full hover:bg-emerald-400 transition-all duration-300 w-full mt-6 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                                <span className="relative z-10 text-lg">Calcular Meu Ranking Público</span>
                            </Link>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
