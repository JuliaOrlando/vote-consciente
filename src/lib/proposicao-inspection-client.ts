import type { ProposicaoInspectionData } from "@/lib/proposicao-inspection";

export const PROPOSICAO_INSPECTION_SESSION_CACHE_KEY = "proposicaoInspectionCache:v1";

export type ProposicaoInspectionCacheMap = Record<number, ProposicaoInspectionData>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function fetchProposicaoInspection(id: number): Promise<ProposicaoInspectionData> {
  const response = await fetch(`/api/proposicoes/${id}/inspection`);

  if (!response.ok) {
    throw new Error(`Falha ao carregar inspecao da proposicao: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.dados) {
    throw new Error("Resposta invalida ao carregar detalhes da votacao.");
  }

  return data.dados as ProposicaoInspectionData;
}

export function parseInspectionSessionCache(value: string | null): ProposicaoInspectionCacheMap {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!isRecord(parsed)) return {};

    const normalizedEntries: Array<[number, ProposicaoInspectionData]> = [];

    for (const [rawKey, rawValue] of Object.entries(parsed)) {
      const key = Number(rawKey);
      if (!Number.isInteger(key) || key <= 0) continue;
      if (!isRecord(rawValue)) continue;

      const proposicaoId = Number(rawValue.proposicaoId);
      if (!Number.isInteger(proposicaoId) || proposicaoId <= 0) continue;

      normalizedEntries.push([key, rawValue as ProposicaoInspectionData]);
    }

    return Object.fromEntries(normalizedEntries);
  } catch {
    return {};
  }
}

export function readInspectionSessionCache() {
  if (typeof window === "undefined") return {} as ProposicaoInspectionCacheMap;
  return parseInspectionSessionCache(window.sessionStorage.getItem(PROPOSICAO_INSPECTION_SESSION_CACHE_KEY));
}

export function writeInspectionSessionCache(cache: ProposicaoInspectionCacheMap) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PROPOSICAO_INSPECTION_SESSION_CACHE_KEY, JSON.stringify(cache));
}

