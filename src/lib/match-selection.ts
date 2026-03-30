export const MATCH_SELECTION_STORAGE_KEY = "matchSelectedPropositions";

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

