"use client"

import { useState, useEffect } from "react"
import { searchDeputados } from "./actions"
import type { Parlamentar } from "@prisma/client"
import { Search, Loader2, Building2, MapPin, Building, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO"
]

const PARTIDOS = [
  "PL", "PT", "UNIÃO", "PP", "PSD", "MDB", "REPUBLICANOS", "PSDB", "PDT",
  "PSB", "PSOL", "PODEMOS", "AVANTE", "PCdoB", "CIDADANIA", "PV", "PROS",
  "SOLIDARIEDADE", "PATRIOTA", "NOVO", "REDE"
]

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"deputados" | "senadores">("deputados")
  const [query, setQuery] = useState("")
  const [estado, setEstado] = useState("all")
  const [partido, setPartido] = useState("all")

  const [resultados, setResultados] = useState<Parlamentar[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const debouncedQuery = useDebounce(query, 300)
  const TAKE_COUNT = 20
  const totalPages = Math.ceil(totalResults / TAKE_COUNT)

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, estado, partido, activeTab])

  // Fetch data when filters or page changes
  useEffect(() => {
    if (activeTab === "senadores") return;

    async function fetchSearchData() {
      setLoading(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      const skip = (page - 1) * TAKE_COUNT
      const res = await searchDeputados(debouncedQuery, estado, partido, skip, TAKE_COUNT)

      setResultados(res.data)
      setTotalResults(res.total)
      setLoading(false)
    }

    fetchSearchData()
  }, [debouncedQuery, estado, partido, activeTab, page])

  return (
    <div className="min-h-full p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Buscar Parlamentar</h1>
        <p className="text-slate-400">Transparência que dá para entender. Política em dados.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab("deputados")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === "deputados"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
            }`}
        >
          <Building2 className="w-4 h-4" />
          Deputados
        </button>
        <button
          onClick={() => setActiveTab("senadores")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === "senadores"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
            }`}
        >
          <Building className="w-4 h-4" />
          Senadores
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-10">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Digite o nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={activeTab === "senadores"}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-slate-600 shadow-inner disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={activeTab === "senadores"}
              className="w-full appearance-none bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-3 pl-4 pr-10 outline-none transition-all shadow-inner disabled:opacity-50"
            >
              <option value="all">Todos os estados</option>
              {UFS.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={partido}
              onChange={(e) => setPartido(e.target.value)}
              disabled={activeTab === "senadores"}
              className="w-full appearance-none bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-3 pl-4 pr-10 outline-none transition-all shadow-inner disabled:opacity-50"
            >
              <option value="all">Todos os partidos</option>
              {PARTIDOS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === "senadores" ? (
          <div className="text-center py-20 px-6 border border-slate-800/50 rounded-3xl bg-slate-900/30">
            <Building className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Base de Senadores em Construção</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Estamos sincronizando a base de dados oficial do Senado Federal. Por enquanto, explore a base completa de Deputados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="w-full flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : resultados.length === 0 ? (
              <div className="text-center py-20 px-6 border border-slate-800/50 rounded-3xl bg-slate-900/30">
                <p className="text-slate-400">Nenhum deputado encontrado com esses filtros.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence>
                    {resultados.map((dep, i) => (
                      <Link href={`/deputado/${dep.id}`} key={dep.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: (i % 20) * 0.03 }}
                          className="w-full bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 rounded-2xl p-4 flex items-center gap-5 group transition-all"
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-inner">
                            {dep.urlFoto && (
                              <Image
                                src={dep.urlFoto}
                                alt={`Foto de ${dep.nomeEleitoral}`}
                                fill className="object-cover object-top"
                                sizes="56px"
                              />
                            )}
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <h3 className="text-lg font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                              {dep.nomeEleitoral}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> Deputado
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-slate-300 font-bold">{dep.partido}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {dep.uf}
                              </span>
                            </div>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-colors">
                            <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Numeric Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-4 pb-8 flex items-center justify-between border-t border-slate-800/50">
                    <p className="text-sm text-slate-400">
                      Listando <span className="font-semibold text-white">{(page - 1) * TAKE_COUNT + 1}</span> a <span className="font-semibold text-white">{Math.min(page * TAKE_COUNT, totalResults)}</span> de <span className="font-semibold text-white">{totalResults}</span>
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-white">
                        Página {page} de {totalPages}
                      </div>

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
