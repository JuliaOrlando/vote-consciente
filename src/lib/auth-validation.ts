// Validações simples e compartilhadas entre cadastro/login/redefinição.

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

// Retorna a primeira mensagem de erro de credenciais, ou null se estiver tudo certo.
export function validateCredentials(email: string, password: unknown): string | null {
  if (!isValidEmail(email)) return "Informe um e-mail válido.";
  if (!isValidPassword(password)) return `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  return null;
}
