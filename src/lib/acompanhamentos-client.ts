// Helpers de "acompanhar parlamentar" para componentes client.

export type ParlamentarAcompanhado = {
  id: number;
  nomeEleitoral: string;
  partido: string;
  uf: string;
  urlFoto: string | null;
  criadoEm?: string;
};

// Estado de auth + se está seguindo (401 => não logado).
export async function getFollowState(parlamentarId: number): Promise<{ logado: boolean; seguindo: boolean }> {
  const response = await fetch(`/api/acompanhamentos?parlamentarId=${parlamentarId}`);
  if (response.status === 401) return { logado: false, seguindo: false };
  if (!response.ok) return { logado: true, seguindo: false };
  const data = await response.json();
  return { logado: true, seguindo: Boolean(data.seguindo) };
}

export async function follow(parlamentarId: number): Promise<boolean> {
  const response = await fetch("/api/acompanhamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parlamentarId }),
  });
  return response.ok;
}

export async function unfollow(parlamentarId: number): Promise<boolean> {
  const response = await fetch(`/api/acompanhamentos?parlamentarId=${parlamentarId}`, {
    method: "DELETE",
  });
  return response.ok;
}

export async function listFollowing(): Promise<ParlamentarAcompanhado[]> {
  const response = await fetch("/api/acompanhamentos");
  if (!response.ok) return [];
  const data = await response.json();
  return (data.acompanhamentos ?? []) as ParlamentarAcompanhado[];
}
