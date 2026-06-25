"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { Badge, buttonStyles, EmptyState, SurfaceCard, SectionIntro } from "@/components/ui";
import { changePassword, deleteAccount, fetchMe, logout, updateProfile } from "@/lib/auth-client";
import { listFollowing, unfollow, type ParlamentarAcompanhado } from "@/lib/acompanhamentos-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";

// Tela de perfil: dados reais do usuário logado, parlamentares acompanhados e ações da conta.
export default function PerfilPage() {
  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nomeEdit, setNomeEdit] = useState("");
  const [acompanhados, setAcompanhados] = useState<ParlamentarAcompanhado[]>([]);
  const [loadingAcompanhados, setLoadingAcompanhados] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Troca de senha (in-app, exige a senha atual).
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const resetPasswordForm = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmaSenha("");
    setPasswordError("");
    setPasswordSuccess(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (novaSenha.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`A nova senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setChangingPassword(true);
    const result = await changePassword(senhaAtual, novaSenha);
    setChangingPassword(false);

    if (!result.ok) {
      setPasswordError(result.error ?? "Não foi possível alterar a senha.");
      return;
    }
    setPasswordSuccess(true);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmaSenha("");
  };

  // Carrega usuário + parlamentares acompanhados (a rota /perfil é protegida no middleware).
  useEffect(() => {
    let active = true;
    fetchMe().then((usuario) => {
      if (!active || !usuario) return;
      setNome(usuario.nome ?? "Sem nome");
      setNomeEdit(usuario.nome ?? "");
      setEmail(usuario.email ?? "");
    });
    listFollowing().then((lista) => {
      if (!active) return;
      setAcompanhados(lista);
      setLoadingAcompanhados(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Salva o nome do perfil na conta (Update).
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const result = await updateProfile(nomeEdit);
    if (result.ok) {
      setNome(result.usuario.nome ?? nomeEdit);
      setIsEditingProfile(false);
    }
    setSavingProfile(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  };

  // Deixa de acompanhar um parlamentar.
  const handleUnfollow = async (id: number) => {
    const ok = await unfollow(id);
    if (ok) setAcompanhados((prev) => prev.filter((p) => p.id !== id));
  };

  // Baixa os dados da conta em JSON.
  const handleExport = () => {
    setExporting(true);
    // Navega direto para a rota de exportação (Content-Disposition dispara o download).
    window.location.href = "/api/account/export";
    setTimeout(() => setExporting(false), 1500);
  };

  // Exclui a conta após confirmação.
  const handleDeleteAccount = async () => {
    const confirmado = window.confirm(
      "Tem certeza que deseja excluir sua conta? Esta ação é permanente e remove seus votos e parlamentares acompanhados."
    );
    if (!confirmado) return;

    setDeleting(true);
    const result = await deleteAccount();
    if (!result.ok) {
      setDeleting(false);
      window.alert(result.error ?? "Não foi possível excluir a conta.");
      return;
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden p-6 sm:p-8">
        <SectionIntro
          eyebrow="Minha conta"
          title="Perfil do usuário"
          description="Gerencie seus dados, foto de perfil e lista de itens acompanhados."
          action={
            <Link href="/simulador/resultado" className={buttonStyles({ variant: "secondary", size: "md" })}>
              <Sparkles className="h-4 w-4" />
              Ir para Meu Match
            </Link>
          }
          className="mb-0"
        />
      </SurfaceCard>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        {/* Coluna esquerda — dados pessoais */}
        <div className="space-y-4 min-w-0">
          <SurfaceCard className="space-y-5 p-5 sm:p-6 min-w-0">
            {/* Avatar — ícone padrão para todos os usuários. */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border-2 border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_16px_32px_-24px_rgba(13,107,100,0.4)]">
                <Users className="h-10 w-10" />
              </div>
            </div>

            {/* Dados do usuário */}
            {isEditingProfile ? (
              <div className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[color:var(--ink)]">Nome</span>
                  <input
                    id="perfil-nome-edit"
                    type="text"
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    className="vc-input"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    id="btn-salvar-perfil"
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className={buttonStyles({ variant: "primary", size: "sm", className: "flex-1" })}
                  >
                    {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {savingProfile ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditingProfile(false); setNomeEdit(nome); }}
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold text-[color:var(--ink)]">{nome}</p>
                  <p className="text-sm text-[color:var(--ink-muted)]">{email}</p>
                </div>
                <button
                  id="btn-editar-perfil"
                  type="button"
                  onClick={() => { setIsEditingProfile(true); setNomeEdit(nome); }}
                  className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full" })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar perfil
                </button>
              </div>
            )}
          </SurfaceCard>

          {/* Ações da conta */}
          <SurfaceCard className="space-y-3 p-5">
            <p className="text-sm font-semibold text-[color:var(--ink)]">Ações da conta</p>
            <div className="space-y-2">
              <button
                id="btn-alterar-senha"
                type="button"
                onClick={() => {
                  setShowChangePassword((v) => !v);
                  resetPasswordForm();
                }}
                className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full justify-start" })}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Alterar senha
              </button>

              {showChangePassword ? (
                <form onSubmit={handleChangePassword} className="space-y-2 rounded-2xl border border-[color:var(--border)] bg-white p-3">
                  {passwordSuccess ? (
                    <div className="flex items-start gap-2 rounded-xl border border-[color:rgba(13,107,100,0.22)] bg-[color:var(--accent-soft)] p-2.5 text-xs text-[color:var(--ink)]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent-strong)]" />
                      <p>Senha alterada com sucesso.</p>
                    </div>
                  ) : null}
                  {passwordError ? (
                    <div role="alert" className="flex items-start gap-2 rounded-xl border border-[color:rgba(176,57,38,0.22)] bg-[color:rgba(176,57,38,0.06)] p-2.5 text-xs text-[color:var(--danger-ink)]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>{passwordError}</p>
                    </div>
                  ) : null}
                  <input
                    id="senha-atual"
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Senha atual"
                    required
                    autoComplete="current-password"
                    className="vc-input text-sm"
                  />
                  <input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Nova senha (mín. 8)"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    className="vc-input text-sm"
                  />
                  <input
                    id="confirma-nova-senha"
                    type="password"
                    value={confirmaSenha}
                    onChange={(e) => setConfirmaSenha(e.target.value)}
                    placeholder="Confirmar nova senha"
                    required
                    autoComplete="new-password"
                    className="vc-input text-sm"
                  />
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className={buttonStyles({ variant: "primary", size: "sm", className: "w-full" })}
                  >
                    {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {changingPassword ? "Salvando..." : "Salvar nova senha"}
                  </button>
                </form>
              ) : null}
              <button
                id="btn-exportar-dados"
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full justify-start" })}
              >
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Exportar meus dados
              </button>
              <button
                id="btn-excluir-conta"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={buttonStyles({
                  variant: "ghost",
                  size: "sm",
                  className: "w-full justify-start text-[color:var(--danger-ink)] hover:border-[color:rgba(176,57,38,0.2)]",
                })}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Excluir minha conta
              </button>
            </div>
            <div className="border-t border-[color:var(--border)] pt-2">
              <button
                type="button"
                id="btn-sair"
                onClick={handleLogout}
                disabled={loggingOut}
                className={buttonStyles({ variant: "ghost", size: "sm", className: "w-full justify-start text-[color:var(--ink-muted)]" })}
              >
                {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                Sair da conta
              </button>
            </div>
          </SurfaceCard>
        </div>

        {/* Coluna direita — parlamentares acompanhados */}
        <div className="space-y-4 min-w-0">
          <SurfaceCard className="space-y-5 p-5 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[color:var(--ink)]">Parlamentares acompanhados</h2>
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Deputados que você marcou para acompanhar. Use o botão “Acompanhar” no perfil de cada um.
                </p>
              </div>
              <Badge tone="primary">
                <Star className="h-3.5 w-3.5" />
                {acompanhados.length}
              </Badge>
            </div>

            {loadingAcompanhados ? (
              <div className="flex items-center gap-3 py-8 text-sm text-[color:var(--ink-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando acompanhados...
              </div>
            ) : acompanhados.length === 0 ? (
              <EmptyState
                icon={User}
                title="Nenhum parlamentar acompanhado"
                description="Abra o perfil de um deputado e toque em “Acompanhar” para vê-lo aqui."
                action={
                  <Link href="/parlamentares" className={buttonStyles({ variant: "primary", size: "sm" })}>
                    Explorar parlamentares
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {acompanhados.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3"
                  >
                    <Link href={`/deputado/${p.id}`} className="flex min-w-0 items-center gap-3">
                      <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-[14px] border border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)]">
                        {p.urlFoto ? (
                          <Image src={p.urlFoto} alt={`Foto de ${p.nomeEleitoral}`} fill sizes="40px" className="object-cover object-top" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[color:var(--accent-strong)]">
                            <User className="h-4 w-4" />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--ink)]">{p.nomeEleitoral}</p>
                        <p className="truncate text-xs text-[color:var(--ink-muted)]">{p.partido} · {p.uf}</p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleUnfollow(p.id)}
                      aria-label={`Deixar de acompanhar ${p.nomeEleitoral}`}
                      className={buttonStyles({
                        variant: "ghost",
                        size: "sm",
                        className: "shrink-0 text-[color:var(--ink-soft)] hover:text-[color:var(--danger-ink)]",
                      })}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          {/* Preview do match salvo */}
          <SurfaceCard className="space-y-3 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">Último resultado do Meu Match</h2>
            <p className="text-sm text-[color:var(--ink-muted)]">
              O histórico de comparações ficará disponível aqui depois de calcular seu match.
            </p>
            <Link href="/simulador/resultado" className={buttonStyles({ variant: "secondary", size: "sm" })}>
              <Sparkles className="h-4 w-4" />
              Ver Meu Match agora
            </Link>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
