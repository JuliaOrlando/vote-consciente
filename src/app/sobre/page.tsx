import Link from "next/link";
import { Database, Scale, Search, ShieldCheck } from "lucide-react";
import { MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <SurfaceCard className="p-6 sm:p-8 lg:p-10">
        <SectionIntro
          eyebrow="Sobre a plataforma"
          title="Informação legislativa organizada para consulta e comparação"
          description="O Vote Consciente reúne votações, perfis parlamentares, despesas, presença e projetos em uma navegação única."
          action={
            <Link href="/parlamentares" className={buttonStyles({ variant: "primary", size: "lg" })}>
              Explorar parlamentares
            </Link>
          }
          className="mb-0"
        />
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={Search}
          label="Busca"
          value="Parlamentares"
          description="Pesquise deputados por nome, partido e unidade federativa."
          tone="primary"
        />
        <MetricTile
          icon={Scale}
          label="Meu Match"
          value="Afinidade pública"
          description="Compare suas respostas com votações reais de deputados federais."
          tone="success"
        />
        <MetricTile
          icon={Database}
          label="Dados"
          value="Bases oficiais"
          description="Perfis consolidam sinais públicos de atuação, presença e gastos."
          tone="neutral"
        />
        <MetricTile
          icon={ShieldCheck}
          label="Perfis"
          value="Projetos e despesas"
          description="Abra o perfil para ver projetos, recibos, comissões e presença."
          tone="warning"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SurfaceCard className="space-y-4">
          <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Como usar</h2>
          <ul className="space-y-3 text-sm leading-7 text-[color:var(--ink-muted)]">
            <li className="vc-panel">Busque um parlamentar para abrir o perfil completo.</li>
            <li className="vc-panel">Vote nas proposições do simulador para calcular seu match.</li>
            <li className="vc-panel">Use os filtros de projetos e gastos para localizar o que você quer analisar.</li>
          </ul>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <h2 className="text-2xl font-semibold text-[color:var(--ink)]">O que você encontra</h2>
          <ul className="space-y-3 text-sm leading-7 text-[color:var(--ink-muted)]">
            <li className="vc-panel">Perfis com partido, UF, comissões, presença e despesas declaradas.</li>
            <li className="vc-panel">Projetos e PECs com situação oficial, resumo curto e link para consulta.</li>
            <li className="vc-panel">Uma área de votação para comparar suas posições com votos reais.</li>
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
