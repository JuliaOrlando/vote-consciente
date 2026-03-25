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
    enableDrag?: boolean;
}

export function SwipeCard({ proposicao, onVote, isFront = true, enableDrag = true }: SwipeCardProps) {
    const [exitX, setExitX] = useState<number>(0);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Mapeia a posição do card para rotação, opacidade e background color
    const rotate = useTransform(x, [-200, 200], [-12, 12]);
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
            setExitX(0);
            y.set(-250);
            onVote(proposicao.id, "PULAR");
        }
    };

    return (
        <motion.div
            style={{
                x,
                y,
                rotate,
                opacity: 1,
                zIndex: 10,
            }}
            drag={isFront && enableDrag ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={enableDrag ? handleDragEnd : undefined}
            animate={exitX !== 0 || y.get() !== 0 ? { x: exitX, y: y.get(), opacity: 0 } : { x: 0, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={enableDrag
                ? "absolute inset-0 m-auto flex h-[29rem] w-[min(100%,24rem)] cursor-grab flex-col overflow-hidden rounded-[32px] border border-[color:rgba(183,199,193,0.72)] bg-white shadow-[0_16px_28px_-22px_rgba(16,42,37,0.16)] active:cursor-grabbing"
                : "absolute inset-0 m-auto flex h-[29rem] w-[min(100%,24rem)] flex-col overflow-hidden rounded-[32px] border border-[color:rgba(183,199,193,0.72)] bg-white shadow-[0_16px_28px_-22px_rgba(16,42,37,0.16)]"
            }
        >
            {/* Indicadores de Voto (Overlay) */}
            <motion.div
                style={{ opacity: overlayOpacity }}
                className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-28 justify-between p-5"
            >
                <motion.div
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-[color:rgba(12,141,103,0.28)] bg-[color:rgba(12,141,103,0.12)] text-[color:var(--success-ink)] rotate-[-15deg]"
                    style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
                >
                    <ThumbsUp className="h-6 w-6" />
                </motion.div>

                <motion.div
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-[color:rgba(176,57,38,0.28)] bg-[color:rgba(176,57,38,0.12)] text-[color:var(--danger-ink)] rotate-[15deg]"
                    style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
                >
                    <ThumbsDown className="h-6 w-6" />
                </motion.div>
            </motion.div>

            {/* Conteúdo do Card */}
            <div className="flex flex-1 flex-col p-5 pt-10">
                <div className="mb-5 inline-flex self-start rounded-full border border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-strong)]">
                    {proposicao.categoria}
                </div>

                <h2 className="mb-4 font-display text-[2rem] font-semibold leading-tight text-[color:var(--ink)]">
                    {proposicao.apelidoIa}
                </h2>

                <p className="flex-1 overflow-y-auto pr-2 text-base leading-7 text-[color:var(--ink-muted)]">
                    {proposicao.resumoCidadao}
                </p>

                {/* Botões de Ação Manuais */}
                <div className="mt-5 border-t border-[color:rgba(183,199,193,0.5)] pt-4">
                    <p className="mb-3 text-sm text-[color:var(--ink-soft)]">Arraste o cartão ou use os botões abaixo.</p>
                    <div className="flex justify-between gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("NAO"); }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(176,57,38,0.22)] bg-[color:rgba(176,57,38,0.08)] px-4 py-3 font-semibold text-[color:var(--danger-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(176,57,38,0.12)]"
                    >
                        <ThumbsDown className="h-4 w-4" />
                        Discordo
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("PULAR"); }}
                        className="rounded-2xl border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-medium text-[color:var(--ink-muted)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[color:var(--ink)]"
                    >
                        Pular
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualVote("SIM"); }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[color:rgba(12,141,103,0.22)] bg-[color:rgba(12,141,103,0.08)] px-4 py-3 font-semibold text-[color:var(--success-ink)] transition-all hover:-translate-y-0.5 hover:bg-[color:rgba(12,141,103,0.12)]"
                    >
                        <ThumbsUp className="h-4 w-4" />
                        Concordo
                    </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
