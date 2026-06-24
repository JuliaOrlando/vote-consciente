"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, Mail } from "lucide-react";
import { buttonStyles, SurfaceCard } from "@/components/ui";
import { requestPasswordReset } from "@/lib/auth-client";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await requestPasswordReset(email);
    setMessage(result.message);
    setLoading(false);
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
              Recuperar senha
            </h1>
            <p className="text-sm text-[color:var(--ink-muted)]">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
          </div>
        </div>

        <SurfaceCard className="space-y-5 p-6 sm:p-8">
          {message ? (
            <div className="flex items-start gap-2 rounded-2xl border border-[color:rgba(13,107,100,0.22)] bg-[color:var(--accent-soft)] p-4 text-sm text-[color:var(--ink)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
              <p>{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">E-mail</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                  <input
                    id="recuperar-email"
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

              <button
                type="submit"
                disabled={loading}
                className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            </form>
          )}
        </SurfaceCard>

        <p className="text-center text-sm text-[color:var(--ink-muted)]">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--accent-strong)] hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
