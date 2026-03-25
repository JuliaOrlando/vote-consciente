export type RawSimuladorProposicao = {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  numOficial: string;
  ementaOficial: string;
  resumoCidadao: string | null;
  categoria: string | null;
  statusDescricao: string | null;
};

export type SimuladorCard = {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  numOficial: string;
  titulo: string;
  resumoCidadao: string | null;
  categoria: string;
  statusDescricao: string | null;
  urlOficial: string;
};

let simuladorCardsCache: SimuladorCard[] | null = null;
let simuladorCardsPromise: Promise<SimuladorCard[]> | null = null;

function buildOfficialPropositionUrl(id: number) {
  return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`;
}

function normalizeSummary(summary: string | null, title: string) {
  if (!summary) return null;

  const trimmedSummary = summary.trim();
  if (!trimmedSummary) return null;

  return trimmedSummary.toLowerCase() === title.trim().toLowerCase() ? null : trimmedSummary;
}

function normalizeProposition(proposicao: RawSimuladorProposicao): SimuladorCard {
  const titulo = proposicao.ementaOficial.trim();

  return {
    id: proposicao.id,
    siglaTipo: proposicao.siglaTipo,
    numero: proposicao.numero,
    ano: proposicao.ano,
    numOficial: proposicao.numOficial || `${proposicao.siglaTipo} ${proposicao.numero}/${proposicao.ano}`,
    titulo,
    resumoCidadao: normalizeSummary(proposicao.resumoCidadao, titulo),
    categoria: proposicao.categoria || "GERAL",
    statusDescricao: proposicao.statusDescricao || null,
    urlOficial: buildOfficialPropositionUrl(proposicao.id),
  };
}

export async function getCachedSimuladorCards(
  loader: () => Promise<RawSimuladorProposicao[]>
): Promise<SimuladorCard[]> {
  if (simuladorCardsCache) {
    return simuladorCardsCache;
  }

  if (!simuladorCardsPromise) {
    simuladorCardsPromise = loader()
      .then((items) => {
        simuladorCardsCache = items.map(normalizeProposition);
        return simuladorCardsCache;
      })
      .finally(() => {
        simuladorCardsPromise = null;
      });
  }

  return simuladorCardsPromise;
}
