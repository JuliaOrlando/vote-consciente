"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { Parlamentar } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Loader2,
  MapPin,
  Search,
  Users2,
  Vote,
} from "lucide-react";
import { searchDeputados } from "@/app/actions";
import { cn, formatPercent, getMatchTone } from "@/lib/utils";
import { Badge, EmptyState, MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const PARTIDOS = [
  "PL",
  "PT",
  "UNIÃO",
  "PP",
  "PSD",
  "MDB",
  "REPUBLICANOS",
  "PSDB",
  "PDT",
  "PSB",
  "PSOL",
  "PODEMOS",
  "AVANTE",
  "PCdoB",
  "CIDADANIA",
  "PV",
  "PROS",
  "SOLIDARIEDADE",
  "PATRIOTA",
  "NOVO",
  "REDE",
];

type SearchVariant = "home" | "directory";

function SearchResultRow({ parlamentar }: { parlamentar: Parlamentar }) {
  const hasMatch = typeof parlamentar.matchGlobal === "number";

  return (
    <li>
      <Link
        href={`/deputado/${parlamentar.id}`}
        className="group flex min-h-[84px] items-center gap-4 rounded-[24px] border border-[color:var(--border)] bg-white/94 p-4 transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]"
      >
        <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[18px] border border-[color:rgba(13,107,100,0.16)] bg-[color:var(--accent-soft)]">
          {parlamentar.urlFoto ? (
            <Image
              src={parlamentar.urlFoto}
              alt={`Foto de ${parlamentar.nomeEleitoral}`}
              fill
              sizes="52px"
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[color:var(--accent-strong)]">
              <Users2 className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-[color:var(--ink)] group-hover:text-[color:var(--accent-strong)]">
                {parlamentar.nomeEleitoral}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[color:var(--ink-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Deputado federal
                </span>
                <span className="font-semibold text-[color:var(--ink)]">{parlamentar.partido}</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {parlamentar.uf}
                </span>
              </div>
            </div>

            {hasMatch ? (
              <Badge tone={getMatchTone(parlamentar.matchGlobal)} className="self-start sm:self-center">
                Match {formatPercent(parlamentar.matchGlobal, 1)}
              </Badge>
            ) : null}
          </div>
        </div>

        <span className="hidden h-10 min-w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--ink-muted)] transition-colors group-hover:border-[color:rgba(13,107,100,0.22)] group-hover:text-[color:var(--accent-strong)] sm:flex">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </li>
  );
}

export function ParliamentarianSearch({ variant = "home" }: { variant?: SearchVariant }) {
  const [casa, setCasa] = useState<"deputados" | "senadores">("deputados");
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("all");
  const [partido, setPartido] = useState("all");
  const [resultados, setResultados] = useState<Parlamentar[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query);
  const takeCount = 20;
  const totalPages = Math.max(1, Math.ceil(totalResults / takeCount));

  useEffect(() => {
    if (casa === "senadores") return;

    let ignore = false;

    async function loadSearch() {
      setLoading(true);
      const skip = (page - 1) * takeCount;
      const response = await searchDeputados(deferredQuery, estado, partido, skip, takeCount);

      if (ignore) return;
      setResultados(response.data);
      setTotalResults(response.total);
      setLoading(false);
    }

    loadSearch();
    return () => {
      ignore = true;
    };
  }, [casa, deferredQuery, estado, partido, page]);

  const header =
    variant === "home"
      ? {
          eyebrow: "Busca de parlamentares",
          title: "Encontre parlamentares federais",
          description:
            "Pesquise deputados por nome, partido ou estado e abra o perfil com gastos, presença, projetos e match quando disponível.",
        }
      : {
          eyebrow: "Diretório público",
          title: "Pesquise parlamentares federais",
          description:
            "Use a busca por nome, partido e unidade federativa para chegar rapidamente ao perfil que você quer analisar.",
        };

  return (
    <section className="space-y-6" aria-labelledby="parlamentarian-search-title">
      <SectionIntro
        eyebrow={header.eyebrow}
        title={header.title}
        description={header.description}
        headingTag={variant === "home" ? "h2" : "h1"}
        action={
          variant === "home" ? (
            <Link href="/simulador" className={buttonStyles({ variant: "secondary", size: "md" })}>
              Ir para votações
            </Link>
          ) : null
        }
        className="mb-2"
      />

      <SurfaceCard className="space-y-6 p-5 sm:p-6 lg:p-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
          <fieldset className="space-y-3">
            <legend id="parlamentarian-search-title" className="sr-only">
              Busca de parlamentares
            </legend>

            <div className="inline-flex w-full rounded-full border border-[color:var(--border)] bg-white p-1 sm:w-auto">
              <button
                type="button"
                aria-pressed={casa === "deputados"}
                onClick={() => {
                  setCasa("deputados");
                  setPage(1);
                  setLoading(true);
                }}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                  casa === "deputados"
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white shadow-[0_14px_24px_-20px_rgba(13,107,100,0.7)] hover:bg-[color:var(--accent-strong)] hover:text-white"
                    : "border-transparent bg-transparent text-[color:var(--ink-muted)] hover:bg-[color:rgba(13,107,100,0.06)] hover:text-[color:var(--ink)]"
                )}
              >
                Deputados
              </button>
              <button
                type="button"
                aria-pressed={casa === "senadores"}
                onClick={() => {
                  setCasa("senadores");
                  setResultados([]);
                  setTotalResults(0);
                  setLoading(false);
                  setPage(1);
                }}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                  casa === "senadores"
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white shadow-[0_14px_24px_-20px_rgba(13,107,100,0.7)] hover:bg-[color:var(--accent-strong)] hover:text-white"
                    : "border-transparent bg-transparent text-[color:var(--ink-muted)] hover:bg-[color:rgba(13,107,100,0.06)] hover:text-[color:var(--ink)]"
                )}
              >
                Senadores
              </button>
            </div>

            <div className="relative">
              <label htmlFor="search-query" className="sr-only">
                Buscar parlamentar por nome, partido ou estado
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--ink-soft)]" />
              <input
                id="search-query"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                disabled={casa === "senadores"}
                placeholder="Digite nome, partido ou UF"
                className="vc-input pl-12 disabled:cursor-not-allowed disabled:bg-white/60"
              />
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink-muted)]">Estado</span>
              <div className="relative">
                <select
                  value={estado}
                  onChange={(event) => {
                    setEstado(event.target.value);
                    setPage(1);
                  }}
                  disabled={casa === "senadores"}
                  className="vc-select disabled:cursor-not-allowed disabled:bg-white/60"
                >
                  <option value="all">Todos os estados</option>
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--ink-soft)]">
                  ▾
                </span>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink-muted)]">Partido</span>
              <div className="relative">
                <select
                  value={partido}
                  onChange={(event) => {
                    setPartido(event.target.value);
                    setPage(1);
                  }}
                  disabled={casa === "senadores"}
                  className="vc-select disabled:cursor-not-allowed disabled:bg-white/60"
                >
                  <option value="all">Todos os partidos</option>
                  {PARTIDOS.map((sigla) => (
                    <option key={sigla} value={sigla}>
                      {sigla}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--ink-soft)]">
                  ▾
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile
            icon={Search}
            label="Busca simplificada"
            value="Nome, partido ou UF"
            description="Resultados priorizam leitura rápida, foto e ação principal."
            tone="primary"
          />
          <MetricTile
            icon={Vote}
            label="Dados públicos"
            value="Base oficial"
            description="Os perfis conectam o diretório a votações, presença e despesas."
            tone="neutral"
          />
          <MetricTile
            icon={Users2}
            label="Comparação cívica"
            value="Match quando houver"
            description="Afinidade aparece como sinal complementar, sem competir com a identidade do parlamentar."
            tone="success"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="text-sm text-[color:var(--ink-muted)]">
            {casa === "senadores"
              ? "Base de senadores ainda em preparação."
              : loading
                ? "Atualizando resultados..."
                : `${totalResults} resultado${totalResults === 1 ? "" : "s"} encontrado${totalResults === 1 ? "" : "s"}.`}
          </div>
          {casa === "deputados" && totalResults > 0 ? (
            <p className="text-sm text-[color:var(--ink-soft)]">
              Página {page} de {totalPages}
            </p>
          ) : null}
        </div>

        {casa === "senadores" ? (
          <EmptyState
            icon={Vote}
            title="Senadores em breve"
            description="A navegação já está preparada para o Senado, mas a base desta área ainda está sendo sincronizada. Enquanto isso, explore os perfis de deputados federais."
          />
        ) : loading ? (
          <SurfaceCard className="flex min-h-[240px] items-center justify-center">
            <div className="flex items-center gap-3 text-[color:var(--ink-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando parlamentares...</span>
            </div>
          </SurfaceCard>
        ) : resultados.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhum parlamentar encontrado"
            description="Tente reduzir os filtros ou buscar apenas parte do nome. A lista é atualizada automaticamente."
          />
        ) : (
          <SurfaceCard className="space-y-4 p-3 sm:p-4">
            <ul className="space-y-3" aria-label="Resultados da busca">
              {resultados.map((parlamentar) => (
                <SearchResultRow key={parlamentar.id} parlamentar={parlamentar} />
              ))}
            </ul>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-[color:rgba(183,199,193,0.5)] px-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Exibindo {Math.min((page - 1) * takeCount + 1, totalResults)} a{" "}
                  {Math.min(page * takeCount, totalResults)} de {totalResults}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            ) : null}
          </SurfaceCard>
        )}
      </div>
    </section>
  );
}
