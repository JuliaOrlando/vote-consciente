import Link from "next/link";
import { Scale, Search, ShieldCheck } from "lucide-react";
import { ParliamentarianSearch } from "@/components/ParliamentarianSearch";
import { MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end">
          <SectionIntro
            eyebrow="Vote Consciente"
            title="Acompanhe mandatos e votações com linguagem clara, sem perder rigor público"
            description="A plataforma organiza proposições, despesas, presença e afinidade política em uma arquitetura visual mais simples de entender. O foco é ajudar a cidadania a ler melhor o que já é público."
            action={
              <>
                <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "lg" })}>
                  Começar votações
                </Link>
                <Link href="/sobre" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  Entender a proposta
                </Link>
              </>
            }
            className="mb-0"
          />

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricTile
              icon={Search}
              label="Diretório federal"
              value="Busca rápida"
              description="Pesquise deputados por nome, partido e estado sem ruído visual."
              tone="primary"
            />
            <MetricTile
              icon={Scale}
              label="Meu Match"
              value="Afinidade pública"
              description="Compare suas escolhas com votações reais processadas pelo app."
              tone="success"
            />
            <MetricTile
              icon={ShieldCheck}
              label="Dados oficiais"
              value="Câmara + transparência"
              description="Perfis combinam presença, despesas e projetos em um só fluxo."
              tone="neutral"
            />
          </div>
        </div>
      </SurfaceCard>

      <ParliamentarianSearch variant="home" />
    </div>
  );
}
