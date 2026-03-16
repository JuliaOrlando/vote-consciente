"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import { ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import clsx from "clsx";

interface Proposicao {
    id: number;
    apelidoIa: string;
    resumoCidadao: string;
    categoria: string;
}

interface SwipeCardProps {
    proposicao: Proposicao;
    onVote: (id: number, voto: "SIM" | "NAO" | "PULAR") => void;
    isFront?: boolean;
}

export function SwipeCard({ proposicao, onVote, isFront = true }: SwipeCardProps) {
    const [exitX, setExitX] = useState<number>(0);
    const x = useMotionValue(0);

    // Mapeia a posição do card para rotação, opacidade e background color
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    const scale = isFront ? 1 : 0.95;
    const overlayOpacity = useTransform(x, [-100, 0, 100], [1, 0, 1]);
    const isRight = useTransform(x, (v) => v > 0);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100) {
            setExitX(250);
            onVote(proposicao.id, "SIM");
        } else if (info.offset.x < -100) {
            setExitX(-250);
            onVote(proposicao.id, "NAO");
        }
    };

    const handleManualVote = (dir: "SIM" | "NAO" | "PULAR") => {
        if (dir === "SIM") {
            setExitX(250);
            onVote(proposicao.id, "SIM");
        } else if (dir === "NAO") {
            setExitX(-250);
            onVote(proposicao.id, "NAO");
        } else {
            setExitX(0); // Optional: animação diferente pra Pular, ex: subir. Vou usar só desaparecer por agora, ou subir.
            y.set(-250);
            onVote(proposicao.id, "PULAR");
        }
    };

    const y = useMotionValue(0);

    return (
        <motion.div
            style={{
                x,
                y,
                rotate,
                opacity,
                scale,
                zIndex: isFront ? 10 : 0,
            }}
            drag={isFront ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            animate={exitX !== 0 || y.get() !== 0 ? { x: exitX, y: y.get(), opacity: 0 } : { x: 0, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-0 left-0 w-full max-w-sm h-[28rem] rounded-3xl bg-slate-800 shadow-2xl border border-slate-700/50 overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
        >
            {/* Indicadores de Voto (Overlay) */}
            <motion.div
                style={{ opacity: overlayOpacity }}
                className="absolute inset-x-0 top-0 h-32 flex justify-between p-6 pointer-events-none z-20"
            >
                <motion.div
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 rotate-[-15deg]"
                    style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
                >
                    <ThumbsUp size={32} />
                </motion.div>

                <motion.div
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-coral-500/20 text-red-500 border-2 border-red-500/50 rotate-[15deg]"
                    style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
                >
                    <ThumbsDown size={32} />
                </motion.div>
            </motion.div>

            {/* Conteúdo do Card */}
            <div className="flex-1 p-6 flex flex-col pt-12">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-700/50 text-slate-300 text-xs font-semibold tracking-wide uppercase mb-6 self-start border border-slate-600/50">
                    {proposicao.categoria}
                </div>

                <h2 className="text-2xl font-bold text-white font-display mb-4 leading-tight">
                    {proposicao.apelidoIa}
                </h2>

                <p className="text-slate-400 text-base leading-relaxed flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {proposicao.resumoCidadao}
                </p>

                {/* Botões de Ação Manuais */}
                <div className="mt-6 flex justify-between gap-3 pt-4 border-t border-slate-700">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("NAO"); }}
                        className="flex-1 py-3.5 rounded-2xl bg-slate-700/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-semibold border border-slate-600/30 hover:border-red-500/30 transition-all flex justify-center items-center group"
                    >
                        <ThumbsDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("PULAR"); }}
                        className="px-6 py-3.5 rounded-2xl bg-slate-700/30 hover:bg-slate-700 text-slate-400 font-medium text-sm transition-all"
                    >
                        Pular
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("SIM"); }}
                        className="flex-1 py-3.5 rounded-2xl bg-slate-700/30 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 font-semibold border border-slate-600/30 hover:border-emerald-500/30 transition-all flex justify-center items-center group"
                    >
                        <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
