import Image from "next/image";
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  Landmark,
  MapPin,
  Receipt,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BackButton } from "./back-button";
import { ProfileClientTabs } from "./ProfileClientTabs";
import { Badge, MetricTile, SurfaceCard } from "@/components/ui";
import { formatCurrency, formatPercent, getMatchTone, getPresenceRate } from "@/lib/utils";

export default async function DeputadoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const depId = Number.parseInt(resolvedParams.id, 10);

  if (Number.isNaN(depId)) {
    return (
      <SurfaceCard className="mx-auto mt-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Deputado não referenciado</h1>
        <p className="mt-3 text-[color:var(--ink-muted)]">
          O identificador informado é inválido. Volte ao diretório de parlamentares para iniciar uma nova busca.
        </p>
      </SurfaceCard>
    );
  }

  const deputado = await prisma.parlamentar.findUnique({
    where: { id: depId },
    include: {
      despesas: true,
      assiduidade: true,
      comissoes: {
        orderBy: [{ dataInicio: "desc" }, { orgao: "asc" }],
      },
      _count: {
        select: {
          despesas: true,
          comissoes: true,
          proposicoes: true,
        },
      },
    },
  });

  if (!deputado) {
    return (
      <SurfaceCard className="mx-auto mt-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Deputado não encontrado</h1>
        <p className="mt-3 text-[color:var(--ink-muted)]">
          Não localizamos esse perfil no banco atual. Tente voltar para a busca e selecionar outro parlamentar.
        </p>
      </SurfaceCard>
    );
  }

  const totalDespesas = deputado.despesas.reduce((acc, item) => acc + item.valor, 0);
  const taxaPresenca = getPresenceRate(deputado.assiduidade);
  const matchScore = deputado.matchGlobal ?? 78.4;
  const comissaoPrincipal = deputado.comissoes[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      <BackButton />

      <SurfaceCard className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="min-w-0 border-b border-[color:rgba(183,199,193,0.5)] bg-[linear-gradient(180deg,rgba(216,239,232,0.92),rgba(255,255,255,0.82))] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="flex flex-col items-start gap-4 sm:flex-row lg:flex-col">
              <div className="relative h-28 w-28 overflow-hidden rounded-[28px] border border-[color:rgba(15,118,110,0.18)] bg-white shadow-[0_24px_48px_-30px_rgba(16,42,37,0.35)] sm:h-32 sm:w-32">
                {deputado.urlFoto ? (
                  <Image
                    src={deputado.urlFoto}
                    alt={`Foto de ${deputado.nomeEleitoral}`}
                    fill
                    sizes="128px"
                    className="object-cover object-top"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[color:var(--accent-strong)]">
                    <Users className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <div className="space-y-2">
                  <p className="vc-eyebrow">Perfil parlamentar</p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
                    {deputado.nomeEleitoral}
                  </h1>
                  <p className="text-base leading-7 text-[color:var(--ink-muted)]">
                    Deputado federal por {deputado.uf}, filiado ao {deputado.partido}. A página resume o mandato com foco em leitura rápida, contexto e comparação pública.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone="primary">Deputado federal</Badge>
                  <Badge tone="neutral">{deputado.partido}</Badge>
                  <Badge tone="neutral">
                    <MapPin className="h-3.5 w-3.5" />
                    {deputado.uf}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-5 p-5 sm:p-7">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0 space-y-3">
                <h2 className="text-xl font-semibold text-[color:var(--ink)]">O que observar primeiro</h2>
                <p className="text-sm leading-7 text-[color:var(--ink-muted)]">
                  Aqui você encontra sinais centrais do mandato: afinidade com o usuário, presença em plenário, gastos declarados e atividade em comissões e projetos.
                </p>
                {comissaoPrincipal ? (
                  <div className="vc-panel">
                    <p className="text-sm font-semibold text-[color:var(--ink)]">Atuação institucional recente</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                      {comissaoPrincipal.tituloCargo} em {comissaoPrincipal.orgao}
                      {comissaoPrincipal.dataInicio ? ` desde ${new Intl.DateTimeFormat("pt-BR").format(comissaoPrincipal.dataInicio)}` : ""}.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="vc-panel min-w-0 flex flex-col gap-3">
                <p className="text-sm font-medium text-[color:var(--ink-muted)]">Afinidade estimada</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-display text-5xl font-semibold leading-none text-[color:var(--ink)]">
                      {formatPercent(matchScore, 1)}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                      {deputado.matchGlobal ? "Baseado no cálculo disponível do app." : "Valor provisório até a simulação do usuário."}
                    </p>
                  </div>
                  <Badge tone={getMatchTone(matchScore)} className="max-w-full self-start">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {matchScore >= 75 ? "Alta afinidade" : matchScore >= 50 ? "Afinidade moderada" : "Baixa afinidade"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                icon={Receipt}
                label="Gasto declarado"
                value={formatCurrency(totalDespesas)}
                description="Soma das despesas agregadas disponíveis no banco local."
                tone="neutral"
              />
              <MetricTile
                icon={Landmark}
                label="Comissões"
                value={deputado._count.comissoes}
                description="Participações cadastradas para leitura rápida da atuação institucional."
                tone="primary"
              />
              <MetricTile
                icon={FileText}
                label="Projetos monitorados"
                value={deputado._count.proposicoes}
                description="Proposições autoradas que o app pode resumir e contextualizar."
                tone="warning"
              />
              <MetricTile
                icon={BriefcaseBusiness}
                label="Presença em plenário"
                value={taxaPresenca ? formatPercent(taxaPresenca, 0) : "Sem base"}
                description="Percentual calculado a partir da base oficial de assiduidade."
                tone="success"
              />
            </div>
          </div>
        </div>
      </SurfaceCard>

      <ProfileClientTabs deputado={deputado} />
    </div>
  );
}
