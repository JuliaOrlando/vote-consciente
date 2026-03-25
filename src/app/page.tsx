import Link from "next/link";
import { Scale, Search } from "lucide-react";
import { ParliamentarianSearch } from "@/components/ParliamentarianSearch";
import { MetricTile, SectionIntro, SurfaceCard, buttonStyles } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-end">
          <SectionIntro
            eyebrow="Vote Consciente"
            title="Pesquise parlamentares, acompanhe votações e compare afinidade"
            description="Encontre deputados federais, veja gastos, presença e projetos, e use as votações para calcular seu match."
            action={
              <>
                <Link href="/simulador" className={buttonStyles({ variant: "primary", size: "lg" })}>
                  Começar votações
                </Link>
                <Link href="/parlamentares" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  Explorar parlamentares
                </Link>
              </>
            }
            className="mb-0"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricTile
              icon={Search}
              label="Busca"
              value="Nome, partido e UF"
              description="Chegue rápido ao perfil que você quer analisar."
              tone="primary"
            />
            <MetricTile
              icon={Scale}
              label="Meu Match"
              value="Compare posições"
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
