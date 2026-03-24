"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

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
            className="absolute top-0 left-0 flex h-[30rem] w-full max-w-sm cursor-grab flex-col overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,249,0.94))] shadow-[0_40px_90px_-44px_rgba(16,42,37,0.4)] active:cursor-grabbing"
        >
            {/* Indicadores de Voto (Overlay) */}
            <motion.div
                style={{ opacity: overlayOpacity }}
                className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-32 justify-between p-6"
            >
                <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[color:rgba(12,141,103,0.28)] bg-[color:rgba(12,141,103,0.12)] text-[color:var(--success-ink)] rotate-[-15deg]"
                    style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
                >
                    <ThumbsUp size={32} />
                </motion.div>

                <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[color:rgba(176,57,38,0.28)] bg-[color:rgba(176,57,38,0.12)] text-[color:var(--danger-ink)] rotate-[15deg]"
                    style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
                >
                    <ThumbsDown size={32} />
                </motion.div>
            </motion.div>

            {/* Conteúdo do Card */}
            <div className="flex flex-1 flex-col p-6 pt-12">
                <div className="mb-6 inline-flex self-start rounded-full border border-[color:rgba(15,118,110,0.18)] bg-[color:var(--accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-strong)]">
                    {proposicao.categoria}
                </div>

                <h2 className="mb-4 font-display text-3xl font-semibold leading-tight text-[color:var(--ink)]">
                    {proposicao.apelidoIa}
                </h2>

                <p className="flex-1 overflow-y-auto pr-2 text-base leading-7 text-[color:var(--ink-muted)]">
                    {proposicao.resumoCidadao}
                </p>

                {/* Botões de Ação Manuais */}
                <div className="mt-6 border-t border-[color:rgba(183,199,193,0.5)] pt-4">
                    <p className="mb-3 text-sm text-[color:var(--ink-soft)]">Arraste o cartão ou use os botões abaixo.</p>
                    <div className="flex justify-between gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("NAO"); }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(176,57,38,0.2)] bg-[color:rgba(176,57,38,0.08)] px-4 py-3.5 font-semibold text-[color:var(--danger-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(176,57,38,0.12)]"
                    >
                        <ThumbsDown className="h-5 w-5" />
                        Discordo
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("PULAR"); }}
                        className="rounded-2xl border border-[color:var(--border)] bg-white px-5 py-3.5 text-sm font-medium text-[color:var(--ink-muted)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[color:var(--ink)]"
                    >
                        Pular
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("SIM"); }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(12,141,103,0.2)] bg-[color:rgba(12,141,103,0.08)] px-4 py-3.5 font-semibold text-[color:var(--success-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(12,141,103,0.12)]"
                    >
                        <ThumbsUp className="h-5 w-5" />
                        Concordo
                    </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
