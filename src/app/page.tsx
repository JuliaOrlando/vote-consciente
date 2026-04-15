import Link from "next/link";
import { Scale, Search } from "lucide-react";
import { ParliamentarianSearch } from "@/components/ParliamentarianSearch";
import { SurfaceCard, buttonStyles } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

// Card de destaque usado no hero — texto menor que MetricTile para não quebrar em telas pequenas
function HeroFeatureCard({
  icon: Icon,
  label,
  title,
  description,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  tone: "primary" | "success";
}) {
  const iconClass =
    tone === "primary"
      ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:rgba(13,107,100,0.24)]"
      : "bg-[color:rgba(12,141,103,0.1)] text-[color:var(--success-ink)] border-[color:rgba(12,141,103,0.22)]";

  return (
    <div className="vc-panel flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">{label}</p>
      </div>
      <p className="text-lg font-semibold text-[color:var(--ink)] sm:text-xl">{title}</p>
      <p className="text-sm leading-6 text-[color:var(--ink-muted)]">{description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        {/* Hero: título e cards lado a lado em telas maiores, empilhado no mobile */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-center">

          {/* Coluna esquerda: título, descrição, botões */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="vc-eyebrow">Vote Consciente</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl lg:text-5xl">
                Pesquise parlamentares, acompanhe votações e compare afinidade
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-muted)]">
                Encontre deputados federais, veja gastos, presença e projetos, e use as votações para calcular seu match.
              </p>
            </div>

            {/* Botões de ação — flex-wrap para não transbordar em telas médias */}
            <div className="flex flex-wrap gap-3">
              <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "lg" })}>
                Começar votações
              </Link>
              <Link href="/parlamentares" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                Explorar parlamentares
              </Link>
            </div>
          </div>

          {/* Coluna direita: cards de destaque — grade 2 colunas a partir de sm */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <HeroFeatureCard
              icon={Search}
              label="Busca"
              title="Nome, partido e UF"
              description="Chegue rápido ao perfil que você quer analisar."
              tone="primary"
            />
            <HeroFeatureCard
              icon={Scale}
              label="Meu Match"
              title="Compare posições"
              description="Use votações reais para medir afinidade com deputados."
              tone="success"
            />
          </div>
        </div>
      </SurfaceCard>

      <ParliamentarianSearch variant="home" />
    </div>
  );
}
