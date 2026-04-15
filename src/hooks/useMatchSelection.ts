"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  readMatchSelectionFromStorage,
  toggleMatchSelection,
  writeMatchSelectionToStorage,
} from "@/lib/match-selection";

function isSameSelection(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function useMatchSelection() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const skipFirstWriteRef = useRef(true);

  const hydrateFromStorage = useCallback(() => {
    const nextSelection = readMatchSelectionFromStorage();
    setSelectedIds((current) => (isSameSelection(current, nextSelection) ? current : nextSelection));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const handlePageShow = () => {
      hydrateFromStorage();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
    };
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (skipFirstWriteRef.current) {
      skipFirstWriteRef.current = false;
      return;
    }

    writeMatchSelectionToStorage(selectedIds);
  }, [selectedIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((current) => toggleMatchSelection(current, id));
  }, []);

  const removeSelection = useCallback((id: number) => {
    setSelectedIds((current) => current.filter((item) => item !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    selectedSet,
    toggleSelection,
    removeSelection,
    clearSelection,
  };
}
