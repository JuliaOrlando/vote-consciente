"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, FileText, Loader2, Lock, Mail } from "lucide-react";
import { buttonStyles, SurfaceCard } from "@/components/ui";
import { login, syncVotesAfterLogin } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Leva os votos locais para a conta antes de navegar.
    await syncVotesAfterLogin();

    const redirect = new URLSearchParams(window.location.search).get("redirect");
    router.push(redirect && redirect.startsWith("/") ? redirect : "/perfil");
    router.refresh();
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[24px] border border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_14px_28px_-20px_rgba(13,107,100,0.6)]">
            <FileText className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-[color:var(--ink-muted)]">
              Entre na sua conta para acessar seu Meu Match salvo.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <SurfaceCard className="space-y-5 p-6 sm:p-8">
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
            {/* Email */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="vc-input pl-11"
                />
              </div>
            </label>

            {/* Senha */}
            <label className="block space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[color:var(--ink)]">Senha</span>
                <Link
                  href="/recuperar-senha"
                  className="text-xs text-[color:var(--accent-strong)] hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
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

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </SurfaceCard>

        <p className="text-center text-sm text-[color:var(--ink-muted)]">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-[color:var(--accent-strong)] hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
