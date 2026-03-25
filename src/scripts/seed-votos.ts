import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";
const PROGRESS_FILE = path.join(process.cwd(), ".cache", "seed-votos-progress.json");
const DEFAULT_LIMIT = 120;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_RECHECK_DAYS = 14;
const prisma = new PrismaClient();

type ProgressStore = Record<string, string>;

type CandidateProposition = {
  id: number;
  numOficial: string;
  ano: number;
  rankingRelevancia: number;
  statusDescricao: string | null;
};

type VoteRecord = {
  deputado_: { id: number };
  tipoVoto: string;
};

type VotingSession = {
  id: string;
  data?: string | null;
  dataHoraRegistro?: string | null;
};

type PropositionResult =
  | { status: "synced"; proposition: CandidateProposition; inserted: number }
  | { status: "no-nominal-votes"; proposition: CandidateProposition }
  | { status: "error"; proposition: CandidateProposition; error: unknown };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseNumberFlag(flag: string, fallback: number) {
  const raw = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (!raw) return fallback;

  const value = Number(raw.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function normalizeVote(vote: string) {
  return vote
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function statusPriority(statusDescricao: string | null) {
  const normalized = (statusDescricao || "").toLowerCase();

  if (normalized.includes("plen")) return 120;
  if (normalized.includes("aprov")) return 110;
  if (normalized.includes("urg")) return 100;
  if (normalized.includes("parecer")) return 90;
  if (normalized.includes("pronto para pauta")) return 80;
  if (normalized.includes("comissão")) return 45;
  if (normalized.includes("arquiv")) return -10;
  return 25;
}

function yearPriority(year: number) {
  const currentYear = new Date().getFullYear();

  if (year >= currentYear) return -40;
  if (year === currentYear - 1) return 35;
  if (year >= currentYear - 3) return 50;
  if (year >= currentYear - 6) return 45;
  return 30;
}

function candidateScore(proposition: CandidateProposition) {
  return (
    statusPriority(proposition.statusDescricao) +
    yearPriority(proposition.ano) +
    Math.min(proposition.rankingRelevancia, 40)
  );
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} em ${url}`);
  }

  return (await response.json()) as T;
}

async function ensureProgressDir() {
  await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
}

async function readProgress() {
  try {
    const raw = await fs.readFile(PROGRESS_FILE, "utf-8");
    return JSON.parse(raw) as ProgressStore;
  } catch {
    return {};
  }
}

async function writeProgress(progress: ProgressStore) {
  await ensureProgressDir();
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function shouldRecheck(lastCheckedAt: string | undefined, recheckDays: number) {
  if (!lastCheckedAt) return true;

  const lastChecked = new Date(lastCheckedAt).getTime();
  const cutoff = Date.now() - recheckDays * 24 * 60 * 60 * 1000;
  return Number.isNaN(lastChecked) || lastChecked < cutoff;
}

async function selectCandidates(limit: number, recheckDays: number, force: boolean) {
  const [progress, propositions] = await Promise.all([
    readProgress(),
    prisma.proposicao.findMany({
      where: {
        autores: { some: {} },
        votosParlamentar: { none: {} },
      },
      select: {
        id: true,
        numOficial: true,
        ano: true,
        rankingRelevancia: true,
        statusDescricao: true,
      },
    }),
  ]);

  const eligible = propositions
    .filter((proposition) => force || shouldRecheck(progress[String(proposition.id)], recheckDays))
    .sort((a, b) => candidateScore(b) - candidateScore(a) || b.ano - a.ano || b.id - a.id)
    .slice(0, limit);

  return { progress, candidates: eligible };
}

async function fetchLatestNominalVotes(propositionId: number) {
  const votingData = await fetchJson<{ dados?: VotingSession[] }>(
    `${CAMARA_API_URL}/proposicoes/${propositionId}/votacoes`
  );
  const sessions = Array.isArray(votingData.dados) ? votingData.dados : [];

  const sortedSessions = [...sessions].sort((a, b) => {
    const aValue = new Date(a.dataHoraRegistro || a.data || 0).getTime();
    const bValue = new Date(b.dataHoraRegistro || b.data || 0).getTime();
    return bValue - aValue;
  });

  for (const session of sortedSessions) {
    const votesData = await fetchJson<{ dados?: VoteRecord[] }>(
      `${CAMARA_API_URL}/votacoes/${session.id}/votos`
    );
    const records = Array.isArray(votesData.dados) ? votesData.dados : [];

    if (records.length > 0) {
      return {
        records,
        votingDate: session.data || session.dataHoraRegistro || new Date().toISOString(),
      };
    }

    await sleep(120);
  }

  return null;
}

async function syncPropositionVotes(proposition: CandidateProposition): Promise<PropositionResult> {
  try {
    const nominalVotes = await fetchLatestNominalVotes(proposition.id);

    if (!nominalVotes) {
      return { status: "no-nominal-votes", proposition };
    }

    const votingDate = new Date(nominalVotes.votingDate);
    let inserted = 0;

    for (const record of nominalVotes.records) {
      const parlamentarId = record.deputado_?.id;
      if (!Number.isFinite(parlamentarId)) continue;

      try {
        await prisma.votoParlamentar.upsert({
          where: {
            parlamentarId_proposicaoId: {
              parlamentarId,
              proposicaoId: proposition.id,
            },
          },
          update: {
            voto: normalizeVote(record.tipoVoto),
            dataVoto: votingDate,
          },
          create: {
            parlamentarId,
            proposicaoId: proposition.id,
            voto: normalizeVote(record.tipoVoto),
            dataVoto: votingDate,
          },
        });
        inserted++;
      } catch {
        // Suplentes e registros fora da base local continuam sendo ignorados.
      }
    }

    return { status: "synced", proposition, inserted };
  } catch (error) {
    return { status: "error", proposition, error };
  }
}

async function runPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number
) {
  const results: R[] = [];
  let index = 0;

  async function consume() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume));
  return results;
}

async function seedVotes() {
  const limit = parseNumberFlag("--limit", DEFAULT_LIMIT);
  const concurrency = parseNumberFlag("--concurrency", DEFAULT_CONCURRENCY);
  const recheckDays = parseNumberFlag("--recheck-days", DEFAULT_RECHECK_DAYS);
  const force = hasFlag("--force");
  const resetProgress = hasFlag("--reset-progress");

  if (resetProgress) {
    await ensureProgressDir();
    await fs.rm(PROGRESS_FILE, { force: true });
  }

  console.log("\n====================================================");
  console.log("🗳️  Seed incremental de votos parlamentares");
  console.log("====================================================");
  console.log(`ℹ️  Limite desta execução: ${limit}`);
  console.log(`ℹ️  Concorrência: ${concurrency}`);
  console.log(`ℹ️  Rechecagem: ${recheckDays} dias`);
  console.log(`ℹ️  Forçar rechecagem: ${force ? "sim" : "não"}\n`);

  const { progress, candidates } = await selectCandidates(limit, recheckDays, force);

  if (candidates.length === 0) {
    console.log("✅ Nenhuma proposição pendente para verificar.");
    return;
  }

  console.log(`📋 Proposições selecionadas nesta execução: ${candidates.length}\n`);

  let processed = 0;
  const results = await runPool(
    candidates,
    async (candidate) => {
      const result = await syncPropositionVotes(candidate);
      processed += 1;

      if (result.status === "synced") {
        console.log(
          `[${processed}/${candidates.length}] ✅ ${candidate.numOficial} -> ${result.inserted} votos sincronizados`
        );
      } else if (result.status === "no-nominal-votes") {
        console.log(`[${processed}/${candidates.length}] ⏭️  ${candidate.numOficial} -> sem votação nominal`);
      } else {
        console.log(`[${processed}/${candidates.length}] ❌ ${candidate.numOficial} -> erro de sincronização`);
        console.error(result.error);
      }

      progress[String(candidate.id)] = new Date().toISOString();
      if (processed % 10 === 0 || processed === candidates.length) {
        await writeProgress(progress);
      }

      await sleep(180);
      return result;
    },
    concurrency
  );

  const summary = results.reduce(
    (acc, result) => {
      if (result.status === "synced") {
        acc.syncedPropositions += 1;
        acc.insertedVotes += result.inserted;
      } else if (result.status === "no-nominal-votes") {
        acc.noNominalVotes += 1;
      } else {
        acc.errors += 1;
      }
      return acc;
    },
    { syncedPropositions: 0, insertedVotes: 0, noNominalVotes: 0, errors: 0 }
  );

  const totalEligible = await prisma.proposicao.count({
    where: {
      autores: { some: {} },
      votosParlamentar: { some: {} },
    },
  });

  console.log("\n====================================================");
  console.log("📊 Resumo da execução");
  console.log(`   ✅ Proposições com votos sincronizados: ${summary.syncedPropositions}`);
  console.log(`   🧾 Votos inseridos/atualizados: ${summary.insertedVotes}`);
  console.log(`   ⏭️  Proposições sem votação nominal: ${summary.noNominalVotes}`);
  console.log(`   ❌ Erros: ${summary.errors}`);
  console.log(`   🎯 Base elegível total após execução: ${totalEligible}`);
  console.log("====================================================\n");
}

seedVotes()
  .catch((error) => {
    console.error("❌ Falha crítica no seed de votos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
