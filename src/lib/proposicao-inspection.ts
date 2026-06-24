export type VoteBucketKey = "SIM" | "NAO" | "ABSTENCAO" | "OBSTRUCAO" | "OUTROS";

export type ProposicaoInspectionVoteBucket = {
  key: VoteBucketKey;
  label: string;
  total: number;
  percentage: number;
  rawValues: string[];
};

export type ProposicaoInspectionPartyBucket = {
  partido: string;
  total: number;
  percentage: number;
};

export type ProposicaoInspectionDeputyVote = {
  parlamentarId: number;
  nomeEleitoral: string;
  partido: string;
  uf: string;
  voto: string;
  dataVoto: string;
  urlFoto: string | null;
  ativo: boolean; // false = não está mais em exercício (votou em legislatura anterior)
};

export type ProposicaoInspectionData = {
  proposicaoId: number;
  // Provenância da votação exibida. Ver vault/data-sources/06_voting_definitive.md.
  votacaoFinalizada: boolean; // true = resultado definitivo; false = votação ainda em curso
  votacaoStage: string | null; // descrição da sessão exibida (etapa)
  totalDeputyVotes: number;
  voteBreakdown: ProposicaoInspectionVoteBucket[];
  partyBreakdown: ProposicaoInspectionPartyBucket[];
  individualDeputyVotes: ProposicaoInspectionDeputyVote[];
  availableData: {
    propositionMetadata: boolean;
    generalVotingResult: boolean;
    individualDeputyVotes: boolean;
    chartReadyAggregate: boolean;
    groupedHistoricalVotes: boolean;
  };
  unavailableData: string[];
};

const voteLabelByKey: Record<VoteBucketKey, string> = {
  SIM: "Sim",
  NAO: "Nao",
  ABSTENCAO: "Abstencao",
  OBSTRUCAO: "Obstrucao",
  OUTROS: "Outros",
};

export function normalizeVoteBucketKey(rawVote: string): VoteBucketKey {
  const normalized = rawVote
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalized === "SIM") return "SIM";
  if (normalized === "NAO") return "NAO";
  if (normalized.startsWith("ABSTEN")) return "ABSTENCAO";
  if (normalized.startsWith("OBSTR")) return "OBSTRUCAO";
  return "OUTROS";
}

export function getVoteLabelByKey(key: VoteBucketKey) {
  return voteLabelByKey[key];
}
