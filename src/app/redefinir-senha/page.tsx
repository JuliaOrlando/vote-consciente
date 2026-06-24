"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, FileText, Loader2, Lock } from "lucide-react";
import { buttonStyles, SurfaceCard } from "@/components/ui";
import { resetPassword } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Lê o token da URL no cliente (evita exigir Suspense de useSearchParams).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido. Solicite uma nova redefinição.");
      return;
    }
    if (senha.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (senha !== confirma) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, senha);
    if (!result.ok) {
      setError(result.error ?? "Não foi possível redefinir a senha.");
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[24px] border border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_14px_28px_-20px_rgba(13,107,100,0.6)]">
            <FileText className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
              Nova senha
            </h1>
            <p className="text-sm text-[color:var(--ink-muted)]">Escolha uma nova senha para sua conta.</p>
          </div>
        </div>

        <SurfaceCard className="space-y-5 p-6 sm:p-8">
          {done ? (
            <div className="flex items-start gap-2 rounded-2xl border border-[color:rgba(13,107,100,0.22)] bg-[color:var(--accent-soft)] p-4 text-sm text-[color:var(--ink)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
              <p>Senha redefinida com sucesso! Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl border border-[color:rgba(176,57,38,0.22)] bg-[color:rgba(176,57,38,0.06)] p-3 text-sm text-[color:var(--danger-ink)]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--ink)]">Nova senha</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                    <input
                      id="redefinir-senha"
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      className="vc-input pl-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--ink)]">Confirmar senha</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                    <input
                      id="redefinir-confirma"
                      type={showPassword ? "text" : "password"}
                      value={confirma}
                      onChange={(e) => setConfirma(e.target.value)}
                      placeholder="Repita a senha"
                      required
                      autoComplete="new-password"
                      className="vc-input pl-11"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}
        </SurfaceCard>

        <p className="text-center text-sm text-[color:var(--ink-muted)]">
          <Link href="/login" className="font-semibold text-[color:var(--accent-strong)] hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
