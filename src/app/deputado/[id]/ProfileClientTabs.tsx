"use client"

import { useState, useEffect } from "react"
import { CalendarCheck, Briefcase, TrendingUp, AlertTriangle, FileText, ChevronDown, Award } from "lucide-react"
import { DespesasChart } from "./chart-client"
import { fetchProjetosAutorados, fetchDespesasDetalhadas } from "./actions"

export function ProfileClientTabs({ deputado }: { deputado: any }) {
    const [activeTab, setActiveTab] = useState<"projetos" | "transparencia" | "assiduidade">("projetos")
    const [projetos, setProjetos] = useState<any[]>([])
    const [loadingProjetos, setLoadingProjetos] = useState(true)
    const [expandProjetos, setExpandProjetos] = useState(false)

    const [despesasLista, setDespesasLista] = useState<any[]>([])
    const [loadingDespesas, setLoadingDespesas] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoadingProjetos(true)
            setLoadingDespesas(true)

            const [listProjetos, listDespesas] = await Promise.all([
                fetchProjetosAutorados(deputado.id),
                fetchDespesasDetalhadas(deputado.id)
            ])

            setProjetos(listProjetos)
            setDespesasLista(listDespesas)

            setLoadingProjetos(false)
            setLoadingDespesas(false)
        }
        loadData()
    }, [deputado.id])

    const totalDespesas = deputado.despesas?.reduce((acc: number, curr: { valor: number }) => acc + curr.valor, 0) || 0

    const formatBRL = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    };

    const tabs = [
        { id: "projetos", label: "Projetos de Lei/PECs", icon: FileText },
        { id: "transparencia", label: "Transparência do Gabinete", icon: TrendingUp },
        { id: "assiduidade", label: "Assiduidade no Plenário", icon: CalendarCheck },
    ]

    const projetosExibidos = expandProjetos ? projetos : projetos.slice(0, 5)

    return (
        <div className="w-full">
            {/* The Tab Headers */}
            <div className="flex gap-2 mb-8 pb-2 border-b border-slate-800/60 overflow-hidden w-full">
                {tabs.map(t => {
                    const isActive = activeTab === t.id
                    const Icon = t.icon
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-medium text-sm transition-colors ${isActive
                                ? "bg-slate-800/80 text-white border-b-2 border-indigo-500"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : ""}`} />
                            {t.label}
                        </button>
                    )
                })}
            </div>

            {/* Content Container */}
            <div className="min-h-[400px]">
                {/* Projetos Tab */}
                {activeTab === "projetos" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {loadingProjetos ? (
                            <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" /></div>
                        ) : projetos.length === 0 ? (
                            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-8 text-center text-slate-500">
                                Nenhum Projeto de Lei ou PEC de autoria encontrado no histórico da Câmara.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {projetosExibidos.map(p => (
                                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-500/30 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{p.siglaTipo} {p.numero}/{p.ano}</h3>
                                                    <p className="text-slate-300 mt-2 text-sm leading-relaxed">{p.ementa}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-300 transition-colors"
                                            >
                                                Acessar Oficial
                                            </a>
                                        </div>
                                    </div>
                                ))}

                                {projetos.length > 5 && (
                                    <button
                                        onClick={() => setExpandProjetos(!expandProjetos)}
                                        className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm"
                                    >
                                        {expandProjetos ? "Recolher Projetos" : `Ver mais ${projetos.length - 5} Projetos da Base`}
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandProjetos ? "rotate-180" : ""}`} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Transparência Tab */}
                {activeTab === "transparencia" && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-6 relative z-10">
                            <p className="text-slate-400 text-sm font-medium">Gasto Declarado (Cota Parlamentar)</p>
                            <h3 className="text-4xl font-black text-white mt-1">{formatBRL(totalDespesas)}</h3>
                        </div>

                        <div className="h-48 w-full relative z-10 -ml-2 mb-4">
                            <DespesasChart data={deputado.despesas || []} />
                        </div>

                        {totalDespesas > 500000 && (
                            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500/90 items-start relative z-10 mb-8">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm leading-relaxed">Nota de Atenção: Este gabinete tem utilizado ativamente da cota acima da simulação média conservadora.</p>
                            </div>
                        )}

                        <div className="relative z-10 border-t border-slate-800/60 pt-8 mt-6">
                            <h4 className="text-lg font-bold text-white mb-4">Últimos Recibos (Ao Vivo)</h4>

                            {loadingDespesas ? (
                                <div className="flex justify-center py-6"><div className="w-6 h-6 rounded-full border-t-2 border-indigo-500 animate-spin" /></div>
                            ) : despesasLista.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 text-sm">Nenhuma nota fiscal recente constada no portal da transparência.</div>
                            ) : (
                                <div className="space-y-3">
                                    {despesasLista.map((nota, i) => (
                                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 gap-4">
                                            <div>
                                                <p className="font-medium text-slate-200 line-clamp-1">{nota.nomeFornecedor}</p>
                                                <div className="flex gap-2 items-center mt-1">
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded uppercase tracking-wider">{nota.tipoDespesa}</span>
                                                    <span className="text-xs text-slate-500">{nota.cnpjCpfFornecedor}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-400">{formatBRL(nota.valorLiquido)}</p>
                                                <p className="text-xs text-slate-500">{nota.dataDocumento ? new Date(nota.dataDocumento).toLocaleDateString('pt-BR') : 'Data Indisp.'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}



                {/* Assiduidade Tab */}
                {activeTab === "assiduidade" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {deputado.assiduidade ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner">
                                <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-emerald-400 text-xs uppercase tracking-widest font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Base Câmara Oficial</span>
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium mb-1">Presença Confirmada em Plenário</p>
                                        <h3 className="text-5xl font-black text-white">
                                            {Math.round((deputado.assiduidade.sessoesPresente / (deputado.assiduidade.sessoesPresente + deputado.assiduidade.faltasJustificadas + deputado.assiduidade.ausenciasNaoJustificadas)) * 100)}%
                                        </h3>
                                    </div>
                                    <div className="w-32 h-32 rounded-full bg-slate-800/50 relative flex items-center justify-center shrink-0">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
                                            <path
                                                className="text-slate-800"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3.5"
                                            />
                                            <path
                                                className="text-indigo-500"
                                                strokeDasharray={`${Math.round((deputado.assiduidade.sessoesPresente / (deputado.assiduidade.sessoesPresente + deputado.assiduidade.faltasJustificadas + deputado.assiduidade.ausenciasNaoJustificadas)) * 100)}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3.5"
                                            />
                                        </svg>
                                        <span className="text-3xl font-black text-white z-10">
                                            {Math.round((deputado.assiduidade.sessoesPresente / (deputado.assiduidade.sessoesPresente + deputado.assiduidade.faltasJustificadas + deputado.assiduidade.ausenciasNaoJustificadas)) * 100)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 mt-8 border-t border-slate-800/60">
                                    <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Sessões Presente</span>
                                        <span className="text-white text-2xl font-bold">{deputado.assiduidade.sessoesPresente}</span>
                                    </div>
                                    <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Faltas Justificadas</span>
                                        <span className="text-white text-2xl font-bold">{deputado.assiduidade.faltasJustificadas}</span>
                                    </div>
                                    <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><div className="w-2 h-2 rounded-full bg-coral-500"></div> Não Justificadas</span>
                                        <span className="text-white text-2xl font-bold">{deputado.assiduidade.ausenciasNaoJustificadas}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-8 text-center text-slate-500">
                                Dados de assiduidade indisponíveis para este parlamentar base no momento.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
