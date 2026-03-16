"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, User, Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResultadoPage() {
    const [ranking, setRanking] = useState<{ id: number, nome: string, partido: string, uf: string, pontos: number, amostra: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const runEngine = async () => {
            const votosRaw = localStorage.getItem("votosMatch");
            if (!votosRaw) {
                setErrorMsg("Nenhum voto registrado. Volte ao simulador.");
                setLoading(false);
                return;
            }

            try {
                const votos = JSON.parse(votosRaw);
                const res = await fetch("/api/calc-match", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ votosCidadao: votos })
                });

                if (!res.ok) {
                    const errorObj = await res.json();
                    throw new Error(errorObj.error || "Falha do Motor de Similaridade");
                }

                const data = await res.json();
                setRanking(data.matches || []);
            } catch (e: unknown) {
                console.error(e);
                if (e instanceof Error) {
                    setErrorMsg(e.message);
                } else {
                    setErrorMsg(String(e));
                }
            } finally {
                setLoading(false);
            }
        }

        runEngine();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-slate-950">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white font-display">Calculando Afinidade...</h2>
                <p className="text-slate-400 mt-2 text-center text-sm">cruzando suas respostas com as atas oficiais da câmara.</p>
            </div>
        )
    }

    if (errorMsg) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-slate-950">
                <h2 className="text-xl font-bold text-coral-500 font-display mb-4">Falha na Simulação</h2>
                <p className="text-slate-400 mb-6">{errorMsg}</p>
                <Link href="/simulador" className="px-6 py-3 bg-slate-800 text-white rounded-full hover:bg-slate-700">Refazer Simulação</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen relative p-6 pb-12 bg-slate-950">
            <header className="flex justify-between items-center mb-8 relative z-20">
                <Link href="/simulador" onClick={() => localStorage.removeItem("votosMatch")} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-400" />
                </Link>
                <div className="text-emerald-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Top Matches
                </div>
            </header>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold font-display text-white mb-2">Representantes Ideais</h1>
                <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
                    Cruzamos seus votos com as decisões em plenário. Estes deputados federais votariam como você.
                </p>
            </div>

            <div className="space-y-4 flex-1">
                {ranking.map((deputado, idx) => (
                    <Link href={`/deputado/${deputado.id}`} key={deputado.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="w-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 group transition-colors cursor-pointer relative overflow-hidden"
                        >
                            {/* Medalha p/ o Primeiro Lugar */}
                            {idx === 0 && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/20 to-transparent -z-0" />
                            )}

                            <div className="relative">
                                {/* API Image com Fallback */}
                                <div className="w-14 h-14 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={`https://www.camara.leg.br/internet/deputado/bandep/${deputado.id}.jpg`}
                                        className="w-full h-full object-cover"
                                        alt={deputado.nome}
                                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg class="text-slate-500 w-8 h-8" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }}
                                    />
                                </div>

                                {idx === 0 && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-slate-800">
                                        <CheckCircle2 className="w-3 h-3 text-slate-900" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 z-10">
                                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                                    {deputado.nome}
                                </h3>
                                <span className="text-xs font-semibold tracking-wide text-slate-400">
                                    {deputado.partido} - {deputado.uf}
                                </span>
                            </div>

                            <div className="text-right z-10">
                                <div className={`text-2xl font-black font-display ${deputado.pontos > 70 ? 'text-emerald-400' : deputado.pontos > 40 ? 'text-yellow-400' : 'text-coral-500'}`}>
                                    {deputado.pontos}%
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    Afinidade
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 text-center text-xs text-slate-600">
                Os cálculos consideram as últimas votações processadas do portal Dados Abertos.
            </div>
        </div>
    );
}
