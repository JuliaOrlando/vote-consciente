import { ArrowUpRight, MapPin, Building2, ShieldCheck, User } from "lucide-react";
import { PrismaClient } from "@prisma/client";
import { BackButton } from "./back-button";
import { ProfileClientTabs } from "./ProfileClientTabs";
import Image from "next/image";

const prisma = new PrismaClient();

export default async function DeputadoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const depId = parseInt(resolvedParams.id, 10);

    if (isNaN(depId)) {
        return <div className="p-10 text-white flex justify-center h-screen items-center text-xl font-bold">Deputado não referenciado ou ID inválido.</div>;
    }

    // Busca consolidada
    const deputado = await prisma.parlamentar.findUnique({
        where: { id: depId },
        include: {
            despesas: true,
            assiduidade: true,
            comissoes: true
        }
    });

    if (!deputado) {
        return <div className="p-10 text-white flex justify-center h-screen items-center text-xl font-bold">Deputado não encontrado no banco.</div>;
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header Mínimo pra voltar */}
            <div className="h-16 w-full px-8 pt-6">
                <BackButton />
            </div>

            {/* Layout Principal Bi-colunado (Esquerda: Info, Direita: Dinâmico) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 max-w-7xl mx-auto w-full">

                {/* Coluna Esquerda: ID Card Fixo */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-8">

                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-[0_0_0_2px_rgba(99,102,241,0.5)] bg-slate-800 flex items-center justify-center overflow-hidden relative mb-5">
                                {deputado.urlFoto ? (
                                    <Image
                                        src={deputado.urlFoto}
                                        alt={deputado.nomeEleitoral}
                                        fill className="object-cover object-top"
                                        sizes="128px"
                                        priority
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-slate-500" />
                                )}
                            </div>

                            <h1 className="text-2xl font-black font-display text-white text-center mb-1 leading-snug">
                                {deputado.nomeEleitoral}
                            </h1>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 mt-2 mb-6">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {deputado.matchGlobal ?? 85.4}% Match {deputado.matchGlobal ? "Global" : "Provisório"}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800/60">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cargo</p>
                                    <p className="text-white font-medium text-sm">Deputado Federal</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                                    <span className="text-xs font-black text-slate-400">P</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Partido</p>
                                    <p className="text-white font-medium text-sm">{deputado.partido}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estado</p>
                                    <p className="text-white font-medium text-sm">{deputado.uf}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Tabs e Conteúdo Dinâmico */}
                <div className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                    <ProfileClientTabs deputado={deputado} />
                </div>
            </div>
        </div>
    );
}
