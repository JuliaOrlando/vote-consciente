"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, FileText, Loader2, Lock, Mail } from "lucide-react";
import { buttonStyles, SurfaceCard } from "@/components/ui";

// Tela de login — placeholder para apresentação da Parte 1
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Simula um login sem autenticação real
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
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

          <div className="relative flex items-center gap-4">
            <div className="h-px flex-1 bg-[color:var(--border)]" />
            <span className="text-xs text-[color:var(--ink-soft)]">ou</span>
            <div className="h-px flex-1 bg-[color:var(--border)]" />
          </div>

          {/* Login social placeholder */}
          <button
            id="btn-login-google"
            type="button"
            className={buttonStyles({ variant: "secondary", size: "md", className: "w-full" })}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </button>
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
