import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

type ApiDeputado = {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string | null;
};

const getCachedDeputadosDirectory = unstable_cache(
  async () => {
    const totalLocal = await prisma.parlamentar.count();

    if (totalLocal < 100) {
      const params = new URLSearchParams({
        ordem: "ASC",
        ordenarPor: "nome",
        itens: "600",
        pagina: "1",
      });
      const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?${params.toString()}`;
      const response = await fetch(url, { next: { revalidate: 3600 } });

      if (!response.ok) {
        throw new Error(`Falha ao buscar diretório da API da Câmara: ${response.status}`);
      }

      const data = await response.json();
      const deputados = (data.dados || []) as ApiDeputado[];

      return deputados.map((deputado) => ({
        id: deputado.id,
        nomeEleitoral: deputado.nome,
        partido: deputado.siglaPartido,
        uf: deputado.siglaUf,
        statusMandato: "Ativo",
        urlFoto: deputado.urlFoto || null,
        matchGlobal: null,
      }));
    }

    return prisma.parlamentar.findMany({
      // Exclui parlamentares inativos (mantidos apenas para votações históricas).
      where: { ativo: true },
      orderBy: { nomeEleitoral: "asc" },
    });
  },
  ["deputados-directory-v1"],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const deputados = await getCachedDeputadosDirectory();
    return NextResponse.json({ success: true, dados: deputados });
  } catch (error) {
    console.error("Erro ao carregar diretório de deputados:", error);
    return NextResponse.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
