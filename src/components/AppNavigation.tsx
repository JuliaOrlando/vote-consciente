"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Home,
  Info,
  Menu,
  Search,
  Sparkles,
  Vote,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    label: "Início",
    icon: Home,
    matches: (pathname: string) => pathname === "/",
  },
  {
    href: "/simulador/resultado",
    label: "Meu Match",
    icon: Sparkles,
    matches: (pathname: string) => pathname.startsWith("/simulador/resultado"),
  },
  {
    href: "/simulador",
    label: "Votações",
    icon: Vote,
    matches: (pathname: string) =>
      pathname.startsWith("/simulador") && !pathname.startsWith("/simulador/resultado"),
  },
  {
    href: "/parlamentares",
    label: "Parlamentares",
    icon: Search,
    matches: (pathname: string) => pathname.startsWith("/parlamentares") || pathname.startsWith("/deputado/"),
  },
  {
    href: "/sobre",
    label: "Sobre",
    icon: Info,
    matches: (pathname: string) => pathname.startsWith("/sobre"),
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3 rounded-2xl px-2 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-[color:rgba(13,107,100,0.2)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_14px_28px_-24px_rgba(13,107,100,0.8)] transition-transform group-hover:-translate-y-0.5">
        <FileText className="h-4 w-4" />
      </span>
      <span className={cn("min-w-0", compact && "hidden lg:block")}>
        <span className="block font-display text-lg font-semibold tracking-tight text-[color:var(--ink)]">
          Vote Consciente
        </span>
        <span className="block text-sm text-[color:var(--ink-muted)]">clareza cívica para decidir melhor</span>
      </span>
    </Link>
  );
}

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navigationItems.map(({ href, label, icon: Icon, matches }) => {
        const isActive = matches(pathname);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
              isActive
                ? "border border-[color:rgba(13,107,100,0.14)] bg-white text-[color:var(--ink)] shadow-[0_18px_34px_-30px_rgba(16,42,37,0.34)]"
                : "text-[color:var(--ink-muted)] hover:bg-white/80 hover:text-[color:var(--ink)]"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border transition-colors",
                isActive
                  ? "border-[color:rgba(13,107,100,0.18)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                  : "border-transparent bg-transparent text-[color:var(--ink-soft)] group-hover:border-[color:var(--border)] group-hover:bg-white"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function AppNavigation() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:rgba(148,163,184,0.16)] bg-[color:rgba(243,239,228,0.92)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[1460px] items-center justify-between px-4 py-2.5 sm:px-6">
          <Brand />
          <button
            type="button"
            aria-label={isDrawerOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={() => setIsDrawerOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-white text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]"
          >
            {isDrawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!isDrawerOpen}
      >
        <button
          type="button"
          tabIndex={isDrawerOpen ? 0 : -1}
          aria-label="Fechar menu"
          onClick={() => setIsDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-[rgba(16,42,37,0.22)] transition-opacity",
            isDrawerOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(88vw,21rem)] flex-col gap-6 border-r border-[color:rgba(148,163,184,0.16)] bg-[color:rgba(243,239,228,0.98)] p-4 shadow-[0_30px_70px_-34px_rgba(16,42,37,0.42)] transition-transform duration-200 ease-out",
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Brand />
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setIsDrawerOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-[color:var(--border)] bg-white text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav aria-label="Navegação principal" className="flex flex-col gap-2">
            <NavigationLinks pathname={pathname} onNavigate={() => setIsDrawerOpen(false)} />
          </nav>

          <div className="vc-panel mt-auto space-y-2">
            <p className="text-sm font-semibold text-[color:var(--ink)]">Navegação móvel</p>
            <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
              A barra inferior continua sendo o atalho principal. Use este menu para abrir as mesmas áreas em formato de gaveta.
            </p>
          </div>
        </aside>
      </div>

      <aside className="sticky top-0 hidden h-screen w-[84px] shrink-0 border-r border-[color:rgba(148,163,184,0.14)] bg-[color:rgba(243,239,228,0.78)] px-3 py-5 backdrop-blur md:flex lg:w-[248px] lg:px-4">
        <div className="flex w-full flex-col gap-8">
          <Brand compact />

          <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2">
            <NavigationLinks pathname={pathname} />
          </nav>

          <div className="vc-panel hidden gap-2 lg:flex">
            <p className="text-sm font-semibold text-[color:var(--ink)]">Decisões em linguagem clara</p>
            <p className="text-sm leading-6 text-[color:var(--ink-muted)]">
              Compare votações reais, acompanhe despesas e entenda o mandato sem jargão excessivo.
            </p>
          </div>
        </div>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:rgba(148,163,184,0.16)] bg-[color:rgba(243,239,228,0.96)] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {navigationItems.map(({ href, label, icon: Icon, matches }) => {
            const isActive = matches(pathname);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                  isActive
                    ? "bg-white text-[color:var(--ink)] shadow-[0_14px_24px_-20px_rgba(16,42,37,0.45)]"
                    : "text-[color:var(--ink-soft)] hover:bg-white/80 hover:text-[color:var(--ink)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
