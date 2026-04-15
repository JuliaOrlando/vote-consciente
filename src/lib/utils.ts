import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "Sem data informada";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatPercent(value?: number | null, digits = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Sem cálculo";
  return `${value.toFixed(digits)}%`;
}

export function getPresenceRate(assiduidade?: {
  sessoesPresente: number;
  faltasJustificadas: number;
  ausenciasNaoJustificadas: number;
} | null) {
  if (!assiduidade) return null;

  const total =
    assiduidade.sessoesPresente +
    assiduidade.faltasJustificadas +
    assiduidade.ausenciasNaoJustificadas;

  if (total === 0) return null;
  return (assiduidade.sessoesPresente / total) * 100;
}

export function getProjectStatusTone(status: string, idSituacao?: number | null) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("transformado em norma") ||
    normalized.includes("sancionad") ||
    normalized.includes("promulgad") ||
    normalized.includes("aprovad") ||
    idSituacao === 1140
  ) {
    return "success" as const;
  }

  if (
    normalized.includes("arquivad") ||
    normalized.includes("rejeitad") ||
    normalized.includes("prejudicad")
  ) {
    return "danger" as const;
  }

  if (
    normalized.includes("pronto para pauta") ||
    normalized.includes("aguardando") ||
    normalized.includes("parecer")
  ) {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function getMatchTone(score?: number | null) {
  if (typeof score !== "number") return "neutral" as const;
  if (score >= 75) return "success" as const;
  if (score >= 50) return "warning" as const;
  return "danger" as const;
}
