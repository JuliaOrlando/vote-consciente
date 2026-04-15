"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { Badge, buttonStyles, EmptyState, SurfaceCard, SectionIntro } from "@/components/ui";
import { cn } from "@/lib/utils";

// Tipo para os itens acompanhados — CRUD de objeto principal do usuário
type ItemAcompanhado = {
  id: number;
  tipo: "parlamentar" | "proposicao";
  nome: string;
  detalhe: string;
  adicionadoEm: string;
};

// Dados dummy para demonstração
const ITENS_INICIAIS: ItemAcompanhado[] = [
  { id: 1, tipo: "parlamentar", nome: "Tabata Amaral", detalhe: "PSB · SP", adicionadoEm: "10/04/2026" },
  { id: 2, tipo: "proposicao", nome: "PL 1087/2024", detalhe: "Marco temporal das terras indígenas", adicionadoEm: "11/04/2026" },
  { id: 3, tipo: "parlamentar", nome: "Kim Kataguiri", detalhe: "UNIÃO · SP", adicionadoEm: "12/04/2026" },
];

// Tela de perfil com CRUD de itens acompanhados e upload de foto — placeholder
export default function PerfilPage() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nome, setNome] = useState("Cidadão Ativo");
  const [email] = useState("usuario@exemplo.com");
  const [nomeEdit, setNomeEdit] = useState(nome);
  const [itens, setItens] = useState<ItemAcompanhado[]>(ITENS_INICIAIS);
  const [novoItem, setNovoItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Simula salvar perfil (Update)
  const handleSaveProfile = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setNome(nomeEdit);
      setIsEditingProfile(false);
      setSavingProfile(false);
    }, 1200);
  };

  // Adiciona item à lista (Create)
  const handleAddItem = () => {
    if (!novoItem.trim()) return;
    setAddingItem(true);
    setTimeout(() => {
      setItens((prev) => [
        ...prev,
        {
          id: Date.now(),
          tipo: "proposicao",
          nome: novoItem.trim(),
          detalhe: "Adicionado manualmente",
          adicionadoEm: new Date().toLocaleDateString("pt-BR"),
        },
      ]);
      setNovoItem("");
      setAddingItem(false);
    }, 800);
  };

  // Remove item da lista (Delete)
  const handleRemoveItem = (id: number) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
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
            {/* Avatar com upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="relative h-28 w-28 overflow-hidden rounded-[28px] border-2 border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] shadow-[0_16px_32px_-24px_rgba(13,107,100,0.4)]">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar do usuário"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[color:var(--accent-strong)]">
                      <Users className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  id="btn-alterar-foto"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-white text-[color:var(--ink-muted)] shadow-sm transition-colors hover:border-[color:rgba(13,107,100,0.22)] hover:text-[color:var(--accent-strong)]"
                  aria-label="Alterar foto de perfil"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                id="perfil-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
                aria-label="Selecionar nova foto de perfil"
              />
              <p className="text-center text-xs text-[color:var(--ink-soft)]">
                Clique no ícone para alterar a foto
              </p>
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
                className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full justify-start" })}
              >
                Alterar senha
              </button>
              <button
                id="btn-exportar-dados"
                type="button"
                className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full justify-start" })}
              >
                Exportar meus dados
              </button>
              <button
                id="btn-excluir-conta"
                type="button"
                className={buttonStyles({
                  variant: "ghost",
                  size: "sm",
                  className: "w-full justify-start text-[color:var(--danger-ink)] hover:border-[color:rgba(176,57,38,0.2)]",
                })}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir minha conta
              </button>
            </div>
            <div className="border-t border-[color:var(--border)] pt-2">
              <Link
                href="/login"
                id="btn-sair"
                className={buttonStyles({ variant: "ghost", size: "sm", className: "w-full justify-start text-[color:var(--ink-muted)]" })}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair da conta
              </Link>
            </div>
          </SurfaceCard>
        </div>

        {/* Coluna direita — CRUD de itens acompanhados */}
        <div className="space-y-4 min-w-0">
          <SurfaceCard className="space-y-5 p-5 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[color:var(--ink)]">Itens acompanhados</h2>
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Parlamentares e proposições que você salvou para monitorar.
                </p>
              </div>
              <Badge tone="primary">
                <Star className="h-3.5 w-3.5" />
                {itens.length} itens
              </Badge>
            </div>

            {/* Adicionar novo item (Create) */}
            <div className="flex gap-2">
              <input
                id="input-novo-item"
                type="text"
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                placeholder="Nome do parlamentar ou nº da proposição"
                className="vc-input flex-1"
              />
              <button
                id="btn-adicionar-item"
                type="button"
                onClick={handleAddItem}
                disabled={addingItem || !novoItem.trim()}
                className={buttonStyles({ variant: "primary", size: "md" })}
              >
                {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>

            {/* Lista de itens (Read) */}
            {itens.length === 0 ? (
              <EmptyState
                icon={User}
                title="Nenhum item acompanhado"
                description="Adicione parlamentares ou proposições acima para monitorar."
              />
            ) : (
              <ul className="space-y-2">
                {itens.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border text-xs font-bold",
                          item.tipo === "parlamentar"
                            ? "border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                            : "border-[color:rgba(184,106,28,0.2)] bg-[color:rgba(184,106,28,0.08)] text-[color:var(--warning-ink)]"
                        )}
                      >
                        {item.tipo === "parlamentar" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--ink)]">{item.nome}</p>
                        <p className="truncate text-xs text-[color:var(--ink-muted)]">
                          {item.detalhe} · Adicionado em {item.adicionadoEm}
                        </p>
                      </div>
                    </div>

                    {/* Remover item (Delete) */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remover ${item.nome} da lista`}
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
