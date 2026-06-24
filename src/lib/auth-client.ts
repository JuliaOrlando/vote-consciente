import {
  mergeMatchVotes,
  readMatchVotesFromStorage,
  writeMatchVotesToStorage,
  type MatchVote,
} from "@/lib/match-selection";

// Helpers de autenticação para componentes client.

export type AuthUser = { id: string; nome: string | null; email: string | null };

type AuthResult = { ok: true; usuario: AuthUser } | { ok: false; error: string };

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function login(email: string, senha: string): Promise<AuthResult> {
  const { response, data } = await postJson("/api/auth/login", { email, senha });
  if (!response.ok) return { ok: false, error: data.error ?? "Não foi possível entrar." };
  return { ok: true, usuario: data.usuario };
}

export async function register(nome: string, email: string, senha: string): Promise<AuthResult> {
  const { response, data } = await postJson("/api/auth/register", { nome, email, senha });
  if (!response.ok) return { ok: false, error: data.error ?? "Não foi possível criar a conta." };
  return { ok: true, usuario: data.usuario };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    const data = await response.json();
    return data.usuario ?? null;
  } catch {
    return null;
  }
}

export async function updateProfile(nome: string): Promise<AuthResult> {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: data.error ?? "Não foi possível salvar." };
  return { ok: true, usuario: data.usuario };
}

export async function changePassword(
  senhaAtual: string,
  novaSenha: string
): Promise<{ ok: boolean; error?: string }> {
  const { response, data } = await postJson("/api/auth/change-password", { senhaAtual, novaSenha });
  if (!response.ok) return { ok: false, error: data.error ?? "Não foi possível alterar a senha." };
  return { ok: true };
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const { data } = await postJson("/api/auth/forgot-password", { email });
  return { message: data.message ?? "Se houver uma conta, enviaremos um link." };
}

export async function resetPassword(token: string, senha: string): Promise<{ ok: boolean; error?: string }> {
  const { response, data } = await postJson("/api/auth/reset-password", { token, senha });
  if (!response.ok) return { ok: false, error: data.error ?? "Não foi possível redefinir a senha." };
  return { ok: true };
}

// Após o login: empurra os votos locais para a conta e traz de volta o conjunto
// mesclado, para que o "Meu Match" fique igual no dispositivo e na conta.
export async function syncVotesAfterLogin(): Promise<void> {
  const locais = readMatchVotesFromStorage();

  if (locais.length > 0) {
    await fetch("/api/votos-usuario", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votos: locais }),
    }).catch(() => undefined);
  }

  try {
    const response = await fetch("/api/votos-usuario");
    if (!response.ok) return;
    const data = await response.json();
    const daConta = (data.votos ?? []) as MatchVote[];
    writeMatchVotesToStorage(mergeMatchVotes(locais, daConta));
  } catch {
    // mantém os votos locais se a leitura falhar
  }
}
