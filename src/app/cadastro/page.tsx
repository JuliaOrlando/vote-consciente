"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, Eye, EyeOff, FileText, Loader2, Lock, Mail, User, Users } from "lucide-react";
import { buttonStyles, SurfaceCard } from "@/components/ui";
import { register, syncVotesAfterLogin } from "@/lib/auth-client";

export default function CadastroPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pré-visualiza a foto escolhida (a foto ainda não é persistida no backend).
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(nome, email, senha);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await syncVotesAfterLogin();
    router.push("/perfil");
    router.refresh();
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[24px] border border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_14px_28px_-20px_rgba(13,107,100,0.6)]">
            <FileText className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
              Crie sua conta
            </h1>
            <p className="text-sm text-[color:var(--ink-muted)]">
              Salve seu Meu Match, acompanhe parlamentares e muito mais.
            </p>
          </div>
        </div>

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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Upload de foto de perfil */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="relative h-24 w-24 overflow-hidden rounded-[28px] border-2 border-dashed border-[color:rgba(13,107,100,0.3)] bg-[color:var(--accent-soft)]">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Pré-visualização do avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[color:var(--accent-strong)]">
                      <Users className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  id="btn-upload-avatar"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--ink-muted)] shadow-sm transition-colors hover:border-[color:rgba(13,107,100,0.22)] hover:text-[color:var(--accent-strong)]"
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                id="input-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
                aria-label="Selecionar foto de perfil"
              />
              <p className="text-xs text-[color:var(--ink-soft)]">
                Foto de perfil (opcional) · JPG, PNG ou WebP
              </p>
            </div>

            {/* Nome */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Nome completo</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  id="cadastro-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                  className="vc-input pl-11"
                />
              </div>
            </label>

            {/* Email */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  id="cadastro-email"
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
              <span className="text-sm font-medium text-[color:var(--ink)]">Senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                <input
                  id="cadastro-senha"
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
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

            {/* Termos */}
            <label className="flex items-start gap-3 text-sm text-[color:var(--ink-muted)]">
              <input
                id="cadastro-termos"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded accent-[color:var(--accent)]"
              />
              <span>
                Concordo com os{" "}
                <Link href="/termos" className="font-semibold text-[color:var(--accent-strong)] hover:underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" className="font-semibold text-[color:var(--accent-strong)] hover:underline">
                  Política de Privacidade
                </Link>
              </span>
            </label>

            <button
              id="btn-cadastrar"
              type="submit"
              disabled={loading}
              className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </SurfaceCard>

        <p className="text-center text-sm text-[color:var(--ink-muted)]">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--accent-strong)] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
