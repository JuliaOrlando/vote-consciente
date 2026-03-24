import Link from "next/link";
import { Database, Eye, Scale, Search, ShieldCheck } from "lucide-react";
import { MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <SurfaceCard className="p-6 sm:p-8 lg:p-10">
        <SectionIntro
          eyebrow="Sobre a plataforma"
          title="Vote Consciente organiza informação legislativa para leitura cidadã"
          description="A proposta é reduzir atrito na compreensão de votações, perfis parlamentares e sinais públicos do mandato. O frontend foi desenhado para priorizar contexto, acessibilidade e comparação clara."
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
          description="Diretório enxuto com foco em foto, nome, cargo, partido, estado e ação principal."
          tone="primary"
        />
        <MetricTile
          icon={Scale}
          label="Meu Match"
          value="Afinidade pública"
          description="Comparação entre suas respostas e votações reais processadas pela aplicação."
          tone="success"
        />
        <MetricTile
          icon={Database}
          label="Dados"
          value="Bases oficiais"
          description="Perfis combinam informações públicas já disponibilizadas pelo ecossistema legislativo."
          tone="neutral"
        />
        <MetricTile
          icon={ShieldCheck}
          label="Leitura"
          value="Clareza cívica"
          description="O design privilegia linguagem simples, hierarquia forte e navegação acessível."
          tone="warning"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SurfaceCard className="space-y-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-[color:var(--accent-strong)]" />
            <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Princípios de UX</h2>
          </div>
          <ul className="space-y-3 text-sm leading-7 text-[color:var(--ink-muted)]">
            <li className="vc-panel">Hierarquia visual forte para que o essencial apareça antes do detalhe.</li>
            <li className="vc-panel">Semântica, foco visível e alvos de toque confortáveis em todas as áreas principais.</li>
            <li className="vc-panel">Progressive disclosure para projetos, despesas e presença, sem esconder informação pública importante.</li>
          </ul>
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-[color:var(--accent-strong)]" />
            <h2 className="text-2xl font-semibold text-[color:var(--ink)]">Escopo preservado</h2>
          </div>
          <ul className="space-y-3 text-sm leading-7 text-[color:var(--ink-muted)]">
            <li className="vc-panel">Rotas e fluxos principais foram mantidos, com mudanças concentradas em layout, componentes e responsividade.</li>
            <li className="vc-panel">Algoritmo de match, lógica de negócio e contratos de dados continuam intactos.</li>
            <li className="vc-panel">A nova navegação prioriza Início, Meu Match, Votações, Parlamentares e Sobre sem sobrecarregar telas menores.</li>
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
