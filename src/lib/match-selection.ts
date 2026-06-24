export const MATCH_SELECTION_STORAGE_KEY = "matchSelectedPropositions";
export const MATCH_VOTES_STORAGE_KEY = "votosMatch";

export type MatchVoteValue = "SIM" | "NAO" | "PULAR";
export type MatchVote = { proposicaoId: number; voto: MatchVoteValue };

export function parseStoredMatchVotes(value: string | null): MatchVote[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({ proposicaoId: Number(item?.proposicaoId), voto: item?.voto }))
      .filter(
        (item): item is MatchVote =>
          Number.isFinite(item.proposicaoId) &&
          (item.voto === "SIM" || item.voto === "NAO" || item.voto === "PULAR")
      );
  } catch {
    return [];
  }
}

export function readMatchVotesFromStorage(): MatchVote[] {
  if (typeof window === "undefined") return [];
  return parseStoredMatchVotes(window.localStorage.getItem(MATCH_VOTES_STORAGE_KEY));
}

export function writeMatchVotesToStorage(votes: MatchVote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MATCH_VOTES_STORAGE_KEY, JSON.stringify(votes));
}

// Faz merge de dois conjuntos de votos (o segundo tem prioridade em conflito).
export function mergeMatchVotes(base: MatchVote[], override: MatchVote[]): MatchVote[] {
  const byId = new Map<number, MatchVote>();
  for (const v of base) byId.set(v.proposicaoId, v);
  for (const v of override) byId.set(v.proposicaoId, v);
  return Array.from(byId.values());
}

export function parseStoredMatchSelection(value: string | null) {
  if (!value) return [] as number[];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  } catch {
    return [];
  }
}

export function readMatchSelectionFromStorage() {
  if (typeof window === "undefined") return [] as number[];
  return parseStoredMatchSelection(window.localStorage.getItem(MATCH_SELECTION_STORAGE_KEY));
}

export function writeMatchSelectionToStorage(selectedIds: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MATCH_SELECTION_STORAGE_KEY, JSON.stringify(selectedIds));
}

export function toggleMatchSelection(current: number[], id: number) {
  if (current.includes(id)) {
    return current.filter((currentId) => currentId !== id);
  }

  return [...current, id];
}

