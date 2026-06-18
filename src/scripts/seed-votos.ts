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
  deputado_: {
    id: number;
    nome?: string;
    siglaPartido?: string;
    siglaUf?: string;
    urlFoto?: string | null;
  };
  tipoVoto: string;
};

type VotingSession = {
  id: string;
  data?: string | null;
  dataHoraRegistro?: string | null;
  descricao?: string | null;
};

// Classificação da sessão de votação a partir da descrição oficial.
// Objetivo: distinguir o voto DEFINITIVO sobre o texto da proposição das inúmeras
// votações procedimentais (requerimentos, destaques, emendas). Ver
// vault/data-sources/06_voting_definitive.md.
type VoteKind = "main" | "procedural";

const LEADING = /^\s*(aprovad[oa]|rejeitad[oa]|mantid[oa]|suprimid[oa]|prejudicad[oa]|concedid[oa]|declarad[oa]|retirad[oa]|inadmitid[oa])\b[,\s]*(?:em\s+\w+\s+turno[,\s]*)?(?:o |a |os |as )?/i;
const PROCEDURAL_SUBJECT = /^(requerimento|recurso|quest[aã]o de ordem|destaque|texto\b|admissibilidade|retirada de pauta|adiamento|encerramento|ordem dos trabalhos|vota[cç][aã]o (?:nominal|parcelada|em globo)|audi[eê]ncia|emenda(?!.*substitut))/i;

function classifyVote(descricao: string | null | undefined): { kind: VoteKind; score: number } {
  const desc = (descricao || "").trim();
  const subject = desc.replace(LEADING, "");
  const full = desc.toLowerCase();

  // Procedimental: requerimentos, destaques ("mantido o texto"), emendas avulsas, etc.
  if (PROCEDURAL_SUBJECT.test(subject)) {
    return { kind: "procedural", score: -1000 };
  }

  // Texto principal: pontua por etapa (quanto mais final, maior).
  let score = 0;
  if (/reda[cç][aã]o final/i.test(subject)) score = 95;
  else if (/proposta de emenda à constitui[cç][aã]o|\bpec\b/i.test(subject)) {
    score = /segundo turno/i.test(full) ? 100 : /primeiro turno/i.test(full) ? 90 : 88;
  } else if (/substitut/i.test(subject)) score = 85; // substitutivo / subemenda substitutiva global
  else if (/projeto de lei|projeto de decreto|\bprojeto\b/i.test(subject)) score = 80;
  else if (/parecer/i.test(subject)) score = 60;
  else if (/\bmat[eé]ria\b/i.test(subject)) score = 55;
  else return { kind: "procedural", score: -500 }; // genérico (ex.: "Aprovado.") -> não é texto principal

  return { kind: "main", score };
}

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

type SelectedVote = {
  records: VoteRecord[];
  votingDate: string;
  votacaoId: string;
  descricao: string;
  finalizada: boolean;
};

function sessionTime(session: VotingSession) {
  return new Date(session.dataHoraRegistro || session.data || 0).getTime();
}

async function fetchSessionVotes(sessionId: string) {
  const votesData = await fetchJson<{ dados?: VoteRecord[] }>(
    `${CAMARA_API_URL}/votacoes/${sessionId}/votos`
  );
  return Array.isArray(votesData.dados) ? votesData.dados : [];
}

/**
 * Seleciona o voto DEFINITIVO de uma proposição (regra de 3 níveis):
 *  1. Voto sobre o texto principal (definitivo)        -> finalizada = true
 *  2. Sem voto principal, mas há votação nominal        -> última nominal, finalizada = false
 *  3. Nenhuma votação nominal                           -> null
 * Antes filtra para as sessões DA PRÓPRIA proposição (o id da votação é
 * "{idProposiçãoObjeto}-{seq}"), descartando votações de outras proposições que a
 * API retorna por terem ocorrido nos mesmos eventos.
 */
async function selectDefinitiveVote(propositionId: number): Promise<SelectedVote | null> {
  const votingData = await fetchJson<{ dados?: VotingSession[] }>(
    `${CAMARA_API_URL}/proposicoes/${propositionId}/votacoes`
  );
  const all = Array.isArray(votingData.dados) ? votingData.dados : [];

  // 1. apenas votações da própria proposição
  const own = all.filter((s) => String(s.id).split("-")[0] === String(propositionId));

  // 2. candidatas a texto principal, ordenadas por (etapa mais final, mais recente)
  const mainCandidates = own
    .map((s) => ({ session: s, ...classifyVote(s.descricao) }))
    .filter((c) => c.kind === "main")
    .sort((a, b) => b.score - a.score || sessionTime(b.session) - sessionTime(a.session));

  for (const candidate of mainCandidates.slice(0, 6)) {
    const records = await fetchSessionVotes(candidate.session.id);
    if (records.length > 0) {
      return {
        records,
        votingDate: candidate.session.data || candidate.session.dataHoraRegistro || new Date().toISOString(),
        votacaoId: candidate.session.id,
        descricao: candidate.session.descricao || "",
        finalizada: true,
      };
    }
    await sleep(120);
  }

  // 3. fallback: votação ainda não finalizada -> última sessão nominal disponível
  const byRecency = [...own].sort((a, b) => sessionTime(b) - sessionTime(a));
  for (const session of byRecency) {
    const records = await fetchSessionVotes(session.id);
    if (records.length > 0) {
      return {
        records,
        votingDate: session.data || session.dataHoraRegistro || new Date().toISOString(),
        votacaoId: session.id,
        descricao: session.descricao || "",
        finalizada: false,
      };
    }
    await sleep(120);
  }

  return null;
}

// Garante que o parlamentar exista na base. Se não existir (votou em legislatura
// anterior e não está mais em exercício), cria um registro LEVE (nome+foto+partido)
// marcado como inativo, apenas para aparecer corretamente nos resultados de votação.
async function ensureParlamentar(record: VoteRecord) {
  const dep = record.deputado_;
  await prisma.parlamentar.upsert({
    where: { id: dep.id },
    update: {}, // não toca em parlamentares já existentes (ativos)
    create: {
      id: dep.id,
      nomeEleitoral: dep.nome || `Deputado ${dep.id}`,
      partido: dep.siglaPartido || "Sem Partido",
      uf: dep.siglaUf || "XX",
      statusMandato: "Fora de exercício",
      urlFoto: dep.urlFoto || `https://www.camara.leg.br/internet/deputado/bandep/${dep.id}.jpg`,
      ativo: false,
    },
  });
}

async function syncPropositionVotes(proposition: CandidateProposition): Promise<PropositionResult> {
  try {
    const definitiveVote = await selectDefinitiveVote(proposition.id);

    if (!definitiveVote) {
      // Nível 3: nenhuma votação nominal. Registra que não há votação.
      await prisma.proposicao.update({
        where: { id: proposition.id },
        data: { votacaoId: null, votacaoStage: null, votacaoFinalizada: false, votacaoData: null },
      });
      return { status: "no-nominal-votes", proposition };
    }

    const votingDate = new Date(definitiveVote.votingDate);
    let inserted = 0;

    for (const record of definitiveVote.records) {
      const parlamentarId = record.deputado_?.id;
      if (!Number.isFinite(parlamentarId)) continue;

      try {
        await ensureParlamentar(record);
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
        // Registros sem id válido continuam sendo ignorados.
      }
    }

    // Provenância: qual sessão foi exibida e se é o resultado definitivo.
    await prisma.proposicao.update({
      where: { id: proposition.id },
      data: {
        votacaoId: definitiveVote.votacaoId,
        votacaoStage: definitiveVote.descricao || null,
        votacaoFinalizada: definitiveVote.finalizada,
        votacaoData: votingDate,
      },
    });

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
  const reseed = hasFlag("--reseed");

  if (resetProgress || reseed) {
    await ensureProgressDir();
    await fs.rm(PROGRESS_FILE, { force: true });
  }

  if (reseed) {
    // Os votos anteriores foram coletados com o seletor antigo (sessão mais recente,
    // não a definitiva) e estão misturados entre sessões. Apaga tudo para recoletar
    // de forma correta. Ver vault/data-sources/06_voting_definitive.md.
    const removed = await prisma.votoParlamentar.deleteMany({});
    console.log(`🧹 --reseed: ${removed.count} votos antigos (potencialmente incorretos) removidos.`);
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

// Exporta peças reutilizáveis (testes/scripts pontuais) sem disparar o seed completo.
export { prisma, classifyVote, selectDefinitiveVote, syncPropositionVotes };

// Só executa o seed quando o arquivo é rodado diretamente (e não quando importado).
const isDirectRun = Boolean(process.argv[1] && /seed-votos\.(ts|js)$/.test(process.argv[1]));

if (isDirectRun) {
  seedVotes()
    .catch((error) => {
      console.error("❌ Falha crítica no seed de votos:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
