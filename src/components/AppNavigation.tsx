"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Home,
  Info,
  Search,
  Sparkles,
  Vote,
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
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:rgba(15,118,110,0.18)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[0_16px_36px_-28px_rgba(15,118,110,0.9)] transition-transform group-hover:-translate-y-0.5">
        <FileText className="h-5 w-5" />
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

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:rgba(148,163,184,0.16)] bg-[color:rgba(248,247,242,0.88)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[88px] shrink-0 border-r border-[color:rgba(148,163,184,0.14)] bg-[color:rgba(248,247,242,0.72)] px-3 py-6 backdrop-blur md:flex lg:w-[264px] lg:px-5">
        <div className="flex w-full flex-col gap-8">
          <Brand compact />

          <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2">
            {navigationItems.map(({ href, label, icon: Icon, matches }) => {
              const isActive = matches(pathname);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                    isActive
                      ? "bg-white text-[color:var(--ink)] shadow-[0_20px_48px_-32px_rgba(16,42,37,0.45)]"
                      : "text-[color:var(--ink-muted)] hover:bg-white/70 hover:text-[color:var(--ink)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                      isActive
                        ? "border-[color:rgba(15,118,110,0.18)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                        : "border-transparent bg-transparent text-[color:var(--ink-soft)] group-hover:border-[color:var(--border)] group-hover:bg-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="hidden truncate lg:block">{label}</span>
                </Link>
              );
            })}
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
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:rgba(148,163,184,0.16)] bg-[color:rgba(248,247,242,0.94)] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden"
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
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
                  isActive
                    ? "bg-white text-[color:var(--ink)] shadow-[0_16px_28px_-22px_rgba(16,42,37,0.55)]"
                    : "text-[color:var(--ink-soft)] hover:bg-white/70 hover:text-[color:var(--ink)]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
