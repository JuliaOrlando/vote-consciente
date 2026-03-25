"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  FileText,
  Loader2,
  ReceiptText,
  Search,
  Sparkles,
} from "lucide-react";
import { DespesasChart } from "./chart-client";
import { Badge, EmptyState, MetricTile, SurfaceCard, buttonStyles } from "@/components/ui";
import {
  cn,
  formatCurrency,
  formatDate,
  formatPercent,
  getPresenceRate,
  getProjectStatusTone,
} from "@/lib/utils";

type TabId = "overview" | "projetos" | "gastos" | "presenca";

type DeputadoProfileData = {
  id: number;
  matchGlobal: number | null;
  despesas: Array<{ tipoMesAno: string; valor: number }>;
  assiduidade: {
    sessoesPresente: number;
    faltasJustificadas: number;
    ausenciasNaoJustificadas: number;
  } | null;
  _count?: {
    despesas: number;
  };
};

type ProjetoItem = {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa?: string | null;
  keywords?: string | null;
  idSituacao?: number | null;
  statusProposicao?: {
    descricaoSituacao?: string | null;
  } | null;
  ultimoStatus?: {
    descricaoSituacao?: string | null;
  } | null;
};

type DespesaDetalhada = {
  nomeFornecedor?: string | null;
  tipoDespesa?: string | null;
  cnpjCpfFornecedor?: string | null;
  valorLiquido?: number | null;
  dataDocumento?: string | null;
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Visão geral" },
  { id: "projetos", label: "Votações e projetos" },
  { id: "gastos", label: "Gastos" },
  { id: "presenca", label: "Presença" },
];

function getProjectStatus(status: string, idSituacao?: number | null) {
  const tone = getProjectStatusTone(status, idSituacao);
  if (tone === "success") return { tone, label: "Situação favorável" };
  if (tone === "warning") return { tone, label: "Em andamento" };
  if (tone === "danger") return { tone, label: "Situação desfavorável" };
  return { tone, label: "Em tramitação" };
}

function compactSummary(text?: string | null, length = 120) {
  if (!text) return "Resumo não disponível.";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) return normalized;

  const sentence = normalized.match(/^(.{30,160}?[.!?])(\s|$)/)?.[1];
  if (sentence) return sentence;
  return `${normalized.slice(0, length).trimEnd()}...`;
}

async function fetchDeputadoProfileData(deputadoId: number) {
  const response = await fetch(`/api/deputados/${deputadoId}/profile-data`);

  if (!response.ok) {
    throw new Error(`Falha ao carregar dados do deputado: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.dados) {
    throw new Error("Resposta inválida ao carregar dados do deputado.");
  }

  return data.dados as {
    projetos: ProjetoItem[];
    despesas: DespesaDetalhada[];
  };
}

export function ProfileClientTabs({ deputado }: { deputado: DeputadoProfileData }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [projetos, setProjetos] = useState<ProjetoItem[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(true);
  const [expandProjetos, setExpandProjetos] = useState(false);
  const [filtroAprovadas, setFiltroAprovadas] = useState(false);
  const [busca, setBusca] = useState("");
  const [despesasLista, setDespesasLista] = useState<DespesaDetalhada[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoadingProjetos(true);
      setLoadingDespesas(true);

      try {
        const data = await fetchDeputadoProfileData(deputado.id);

        if (ignore) return;
        setProjetos(data.projetos);
        setDespesasLista(data.despesas);
      } catch (error) {
        console.error("Falha ao carregar dados complementares do deputado", error);
        if (!ignore) {
          setProjetos([]);
          setDespesasLista([]);
        }
      } finally {
        if (!ignore) {
          setLoadingProjetos(false);
          setLoadingDespesas(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [deputado.id]);

  const totalDespesas = deputado.despesas?.reduce((acc: number, curr: { valor: number }) => acc + curr.valor, 0) || 0;
  const taxaPresenca = getPresenceRate(deputado.assiduidade);
  const ultimaDespesa = despesasLista[0]?.dataDocumento;
  const despesasRecentes = despesasLista.slice(0, 3);

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((projeto) => {
      const status = (
        projeto.statusProposicao?.descricaoSituacao ||
        projeto.ultimoStatus?.descricaoSituacao ||
        "Em tramitação"
      ).toLowerCase();

      const matchStatus = !filtroAprovadas
        ? true
        : status.includes("aprovad") ||
          status.includes("transformado em norma") ||
          status.includes("sancionad") ||
          projeto.idSituacao === 1140;

      const termo = busca.trim().toLowerCase();
      const matchBusca =
        termo.length === 0
          ? true
          : `${projeto.siglaTipo} ${projeto.numero}/${projeto.ano}`.toLowerCase().includes(termo) ||
            (projeto.ementa || "").toLowerCase().includes(termo) ||
            (projeto.keywords || "").toLowerCase().includes(termo);

      return matchStatus && matchBusca;
    });
  }, [busca, filtroAprovadas, projetos]);

  const projetosExibidos = expandProjetos ? projetosFiltrados : projetosFiltrados.slice(0, 6);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="sticky top-[4.1rem] z-20 overflow-x-auto rounded-[24px] border border-[color:var(--border)] bg-[color:rgba(247,244,236,0.92)] p-1 shadow-[0_20px_40px_-34px_rgba(16,42,37,0.45)] backdrop-blur md:top-4 md:rounded-[28px] md:p-1.5">
        <div role="tablist" aria-label="Seções do perfil" className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "min-h-10 rounded-full px-3.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)] md:min-h-11 md:px-4",
                  isActive
                    ? "bg-white text-[color:var(--ink)] shadow-[0_18px_32px_-24px_rgba(16,42,37,0.45)]"
                    : "text-[color:var(--ink-muted)] hover:bg-white/80 hover:text-[color:var(--ink)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="space-y-5"
      >
        {activeTab === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <SurfaceCard className="min-w-0 space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <p className="vc-eyebrow">Resumo do mandato</p>
                <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Visão geral rápida</h2>
                <p className="text-sm leading-7 text-[color:var(--ink-muted)]">
                  Veja os principais números do mandato antes de abrir projetos, gastos e presença.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
                <MetricTile
                  icon={Sparkles}
                  label="Afinidade exibida"
                  value={formatPercent(deputado.matchGlobal ?? 78.4, 1)}
                  description="Sinal rápido para comparação com o seu posicionamento quando disponível."
                  tone="primary"
                />
                <MetricTile
                  icon={CalendarCheck}
                  label="Presença calculada"
                  value={taxaPresenca ? formatPercent(taxaPresenca, 0) : "Sem base"}
                  description="Percentual derivado da soma de presenças e ausências registradas."
                  tone="success"
                />
                <MetricTile
                  icon={FileText}
                  label="Projetos encontrados"
                  value={loadingProjetos ? "Carregando" : projetos.length}
                  description="Total de PLs e PECs carregados para este perfil."
                  tone="warning"
                />
                <MetricTile
                  icon={ReceiptText}
                  label="Última atualização de gasto"
                  value={loadingDespesas ? "Carregando" : formatDate(ultimaDespesa)}
                  description="Data do recibo mais recente retornado pelo portal da Câmara."
                  tone="neutral"
                />
              </div>
            </SurfaceCard>

            <div className="min-w-0 space-y-4 sm:space-y-5">
              <SurfaceCard className="min-w-0 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[color:var(--ink-muted)]">Despesas recentes</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                      {formatCurrency(totalDespesas)}
                    </h2>
                  </div>
                  <Badge tone="neutral" className="max-w-full shrink-0 self-start">
                    {deputado._count?.despesas ?? deputado.despesas?.length ?? 0} registros agregados
                  </Badge>
                </div>

                <div className="h-44 rounded-[24px] bg-[linear-gradient(180deg,rgba(216,239,232,0.35),rgba(255,255,255,0.35))] p-3 sm:h-48">
                  <DespesasChart data={deputado.despesas || []} />
                </div>
              </SurfaceCard>

              <SurfaceCard className="min-w-0 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[color:var(--ink-muted)]">Recibos mais recentes</p>
                    <h2 className="text-xl font-semibold text-[color:var(--ink)]">Leitura rápida</h2>
                  </div>
                  {loadingDespesas ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--ink-soft)]" /> : null}
                </div>

                {loadingDespesas ? (
                  <p className="text-sm text-[color:var(--ink-muted)]">Buscando recibos detalhados do portal...</p>
                ) : despesasRecentes.length === 0 ? (
                  <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                    Nenhum recibo recente foi retornado pelo portal de despesas detalhadas.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {despesasRecentes.map((nota, index: number) => (
                      <li key={`${nota.dataDocumento}-${nota.nomeFornecedor}-${index}`} className="vc-panel">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-[color:var(--ink)]">{nota.nomeFornecedor}</p>
                            <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                              {nota.tipoDespesa || "Categoria não informada"}
                            </p>
                          </div>
                          <div className="space-y-1 text-left sm:text-right">
                            <p className="text-base font-semibold text-[color:var(--ink)]">
                              {formatCurrency(nota.valorLiquido || 0)}
                            </p>
                            <p className="text-sm text-[color:var(--ink-soft)]">{formatDate(nota.dataDocumento)}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SurfaceCard>
            </div>
          </div>
        ) : null}

        {activeTab === "projetos" ? (
          <div className="space-y-5">
            <SurfaceCard className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="space-y-3">
                  <p className="vc-eyebrow">Projetos e PECs</p>
                  <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Projetos e PECs do parlamentar</h2>
                  <p className="text-sm leading-7 text-[color:var(--ink-muted)]">
                    Busque por termo ou filtre propostas aprovadas para localizar mais rápido o andamento que você quer consultar.
                  </p>
                </div>

                <label className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[color:var(--border)] bg-white/80 px-4 text-sm text-[color:var(--ink-muted)]">
                  <span>Apenas aprovadas ou transformadas em norma</span>
                  <button
                    type="button"
                    aria-pressed={filtroAprovadas}
                    onClick={() => {
                      setFiltroAprovadas((current) => !current);
                      setExpandProjetos(false);
                    }}
                    className={cn(
                      "relative inline-flex h-7 w-12 rounded-full transition-colors",
                      filtroAprovadas ? "bg-[color:var(--accent)]" : "bg-[color:#c5d0cb]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                        filtroAprovadas ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                    <span className="sr-only">Alternar filtro de projetos aprovados</span>
                  </button>
                </label>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  type="search"
                  value={busca}
                  onChange={(event) => {
                    setBusca(event.target.value);
                    if (event.target.value.trim()) setExpandProjetos(true);
                  }}
                  placeholder="Buscar por número, tipo ou tema da ementa"
                  className="vc-input pl-12"
                />
              </div>
            </SurfaceCard>

            {loadingProjetos ? (
              <SurfaceCard className="flex min-h-[220px] items-center justify-center">
                <div className="flex items-center gap-3 text-[color:var(--ink-muted)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando projetos do parlamentar...</span>
                </div>
              </SurfaceCard>
            ) : projetosFiltrados.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhum projeto encontrado com esses filtros"
                description="Tente remover o termo digitado ou desligar o filtro de aprovadas para ver mais proposições associadas ao parlamentar."
              />
            ) : (
              <div className="space-y-4">
                {projetosExibidos.map((projeto) => {
                  const situacao =
                    projeto.statusProposicao?.descricaoSituacao ||
                    projeto.ultimoStatus?.descricaoSituacao ||
                    "Em tramitação";
                  const statusMeta = getProjectStatus(situacao, projeto.idSituacao);

                  return (
                    <SurfaceCard key={projeto.id} className="space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="primary">
                              {projeto.siglaTipo} {projeto.numero}/{projeto.ano}
                            </Badge>
                            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
                              {compactSummary(projeto.ementa, 150)}
                            </h3>
                            <p className="text-sm leading-7 text-[color:var(--ink-muted)]">{situacao}</p>
                            <p className="text-sm leading-7 text-[color:var(--ink-muted)]">
                              {compactSummary(projeto.ementa, 240)}
                            </p>
                          </div>
                        </div>

                        <a
                          href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${projeto.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonStyles({ variant: "secondary", size: "sm", className: "w-fit" })}
                        >
                          Ver ficha oficial
                        </a>
                      </div>
                    </SurfaceCard>
                  );
                })}

                {projetosFiltrados.length > 6 ? (
                  <button
                    type="button"
                    onClick={() => setExpandProjetos((current) => !current)}
                    className={buttonStyles({ variant: "secondary", size: "md", className: "w-full" })}
                  >
                    {expandProjetos
                      ? "Mostrar menos projetos"
                      : `Mostrar mais ${projetosFiltrados.length - 6} projetos`}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "gastos" ? (
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
              <SurfaceCard className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricTile
                    icon={ReceiptText}
                    label="Total declarado"
                    value={formatCurrency(totalDespesas)}
                    description="Soma agregada das despesas disponíveis no histórico local."
                    tone="neutral"
                  />
                  <MetricTile
                    icon={ReceiptText}
                    label="Recibos detalhados"
                    value={loadingDespesas ? "..." : despesasLista.length}
                    description="Quantidade retornada na consulta detalhada mais recente."
                    tone="primary"
                  />
                  <MetricTile
                    icon={CalendarCheck}
                    label="Última atualização"
                    value={loadingDespesas ? "..." : formatDate(ultimaDespesa)}
                    description="Data do documento mais recente encontrado para este gabinete."
                    tone="warning"
                  />
                </div>

                <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(216,239,232,0.35),rgba(255,255,255,0.4))] p-4">
                  <div className="mb-4 space-y-1">
                    <h2 className="text-xl font-semibold text-[color:var(--ink)]">Evolução das despesas</h2>
                    <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
                      O gráfico usa os registros agregados disponíveis para indicar tendência, não auditoria final.
                    </p>
                  </div>
                  <div className="h-56">
                    <DespesasChart data={deputado.despesas || []} />
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard className="space-y-4">
                <div className="space-y-2">
                  <p className="vc-eyebrow">Como ler</p>
                  <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Despesas com contexto</h2>
                </div>
                <p className="text-sm leading-7 text-[color:var(--ink-muted)]">
                  A lista abaixo mostra fornecedor, categoria, valor e data do documento. Em telas maiores a visualização prioriza comparação; no celular, cada item vira um cartão legível.
                </p>
                {totalDespesas > 500000 ? (
                  <div className="vc-panel flex items-start gap-3 border-[color:rgba(184,106,28,0.18)] bg-[color:rgba(184,106,28,0.08)]">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--warning-ink)]" />
                    <p className="text-sm leading-6 text-[color:var(--warning-ink)]">
                      O total agregado disponível para este gabinete é alto. Vale abrir os recibos e categorias para analisar composição e frequência.
                    </p>
                  </div>
                ) : null}
              </SurfaceCard>
            </div>

            {loadingDespesas ? (
              <SurfaceCard className="flex min-h-[220px] items-center justify-center">
                <div className="flex items-center gap-3 text-[color:var(--ink-muted)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Buscando recibos detalhados...</span>
                </div>
              </SurfaceCard>
            ) : despesasLista.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="Sem recibos detalhados disponíveis"
                description="O portal não retornou notas recentes para esta consulta. O total agregado acima continua visível quando existir no banco local."
              />
            ) : (
              <>
                <SurfaceCard className="hidden p-0 md:block">
                  <table className="vc-table">
                    <thead>
                      <tr>
                        <th>Fornecedor</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasLista.map((nota, index: number) => (
                        <tr key={`${nota.dataDocumento}-${nota.nomeFornecedor}-${index}`}>
                          <td>
                            <div className="space-y-1">
                              <p className="font-semibold text-[color:var(--ink)]">{nota.nomeFornecedor}</p>
                              <p className="text-xs text-[color:var(--ink-soft)]">{nota.cnpjCpfFornecedor || "Documento indisponível"}</p>
                            </div>
                          </td>
                          <td className="text-[color:var(--ink-muted)]">{nota.tipoDespesa || "Não informado"}</td>
                          <td className="font-semibold text-[color:var(--ink)]">{formatCurrency(nota.valorLiquido || 0)}</td>
                          <td className="text-[color:var(--ink-muted)]">{formatDate(nota.dataDocumento)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SurfaceCard>

                <div className="space-y-3 md:hidden">
                  {despesasLista.map((nota, index: number) => (
                    <SurfaceCard key={`${nota.dataDocumento}-${nota.nomeFornecedor}-${index}`} className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-[color:var(--ink)]">{nota.nomeFornecedor}</p>
                          <p className="text-sm text-[color:var(--ink-muted)]">{nota.tipoDespesa || "Categoria não informada"}</p>
                        </div>
                        <Badge tone="neutral">{formatDate(nota.dataDocumento)}</Badge>
                      </div>
                      <div className="flex items-end justify-between gap-4 text-sm">
                        <p className="text-[color:var(--ink-soft)]">{nota.cnpjCpfFornecedor || "Documento indisponível"}</p>
                        <p className="text-base font-semibold text-[color:var(--ink)]">
                          {formatCurrency(nota.valorLiquido || 0)}
                        </p>
                      </div>
                    </SurfaceCard>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {activeTab === "presenca" ? (
          deputado.assiduidade ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
              <SurfaceCard className="space-y-5">
                <div className="space-y-2">
                  <p className="vc-eyebrow">Assiduidade</p>
                  <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Presença registrada em plenário</h2>
                  <p className="text-sm leading-7 text-[color:var(--ink-muted)]">
                    A leitura foi simplificada para mostrar percentual, presença efetiva e ausências justificadas ou não justificadas sem depender só de cor.
                  </p>
                </div>

                <div className="vc-panel space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--ink-muted)]">Taxa calculada</p>
                      <p className="font-display text-5xl font-semibold text-[color:var(--ink)]">
                        {taxaPresenca ? formatPercent(taxaPresenca, 0) : "Sem base"}
                      </p>
                    </div>
                    <Badge tone="success">Base oficial da Câmara</Badge>
                  </div>

                  <div
                    aria-label="Barra de presença"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={taxaPresenca ? Math.round(taxaPresenca) : 0}
                    className="h-4 overflow-hidden rounded-full bg-[color:#d8e2dd]"
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#34a38d)]"
                      style={{ width: `${taxaPresenca ?? 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <MetricTile
                    icon={CalendarCheck}
                    label="Sessões presente"
                    value={deputado.assiduidade.sessoesPresente}
                    description="Participações confirmadas em plenário."
                    tone="success"
                  />
                  <MetricTile
                    icon={CalendarCheck}
                    label="Faltas justificadas"
                    value={deputado.assiduidade.faltasJustificadas}
                    description="Ausências registradas com justificativa."
                    tone="warning"
                  />
                  <MetricTile
                    icon={CalendarCheck}
                    label="Ausências não justificadas"
                    value={deputado.assiduidade.ausenciasNaoJustificadas}
                    description="Faltas sem justificativa na base disponível."
                    tone="danger"
                  />
                </div>
              </SurfaceCard>

              <SurfaceCard className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[color:var(--ink-muted)]">Leitura cidadã</p>
                  <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Como interpretar</h2>
                </div>
                <ul className="space-y-3 text-sm leading-7 text-[color:var(--ink-muted)]">
                  <li className="vc-panel">Presença alta sugere participação consistente nas sessões registradas.</li>
                  <li className="vc-panel">Faltas justificadas não têm o mesmo significado de ausência sem justificativa.</li>
                  <li className="vc-panel">Este indicador deve ser lido junto com projetos, votações e atuação em comissões.</li>
                </ul>
              </SurfaceCard>
            </div>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="Dados de presença indisponíveis"
              description="A base atual não retornou informações de assiduidade para este perfil. As outras áreas do mandato continuam acessíveis."
            />
          )
        ) : null}
      </div>
    </div>
  );
}
