"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Info,
  Menu,
  Search,
  Sparkles,
  UserCircle,
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
  {
    href: "/perfil",
    label: "Minha Conta",
    icon: UserCircle,
    matches: (pathname: string) =>
      pathname.startsWith("/perfil") || pathname.startsWith("/login") || pathname.startsWith("/cadastro"),
  },
];

function Brand({ rail = false, expanded = false }: { rail?: boolean; expanded?: boolean }) {
  const showText = !rail || expanded;

  return (
    <div
      aria-label="Vote Consciente"
      className={cn(
        "flex items-center rounded-2xl py-1",
        rail ? "justify-center px-0 md:gap-3" : "gap-3 px-2",
        rail && expanded && "justify-start"
      )}
    >
      <span className="flex h-10 w-10 shrink-0 overflow-hidden items-center justify-center rounded-[18px] border border-[color:rgba(13,107,100,0.2)] shadow-[0_14px_28px_-24px_rgba(13,107,100,0.8)]">
        <Image src="/logo.png" alt="Vote Consciente Logo" width={40} height={40} className="h-full w-full object-cover" />
      </span>
      {showText ? (
        <span className="min-w-0">
          <span className="block font-display text-lg font-semibold tracking-tight text-[color:var(--ink)]">
            Vote Consciente
          </span>
        </span>
      ) : null}
    </div>
  );
}

function NavigationLinks({
  pathname,
  onNavigate,
  rail = false,
  expanded = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  rail?: boolean;
  expanded?: boolean;
}) {
  return (
    <>
      {navigationItems.map(({ href, label, icon: Icon, matches }) => {
        const isActive = matches(pathname);
        const showText = !rail || expanded;

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            title={rail ? label : undefined}
            onClick={onNavigate}
            className={cn(
              "group/navitem flex min-h-11 items-center gap-3 rounded-2xl py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]",
              rail ? "justify-center px-0" : "px-3",
              rail && expanded && "justify-start px-3",
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
            {showText ? <span className="truncate">{label}</span> : null}
          </Link>
        );
      })}
    </>
  );
}

export function AppNavigation() {
  const pathname = usePathname();
  const [isDesktopRailExpanded, setIsDesktopRailExpanded] = useState(false);

  return (
    <>
      <aside className="sticky top-0 z-30 hidden h-screen w-[84px] shrink-0 md:block">
        <div className="relative h-full w-full overflow-visible">
          <div
            id="desktop-nav-rail"
            className={cn(
              "absolute inset-y-0 left-0 z-40 flex h-full w-[84px] flex-col overflow-hidden rounded-r-[28px] border-r border-[color:rgba(148,163,184,0.14)] bg-[color:rgba(243,239,228,0.9)] px-3 py-5 backdrop-blur transition-[width,box-shadow] duration-150 ease-out motion-reduce:transition-none",
              isDesktopRailExpanded && "w-[236px] shadow-[0_24px_46px_-30px_rgba(16,42,37,0.34)]"
            )}
          >
            <div className="flex w-full flex-col gap-8">
              {isDesktopRailExpanded ? (
                <div className="flex items-center justify-between gap-3">
                  <Brand rail expanded />
                  <button
                    type="button"
                    aria-controls="desktop-nav-rail"
                    aria-expanded={isDesktopRailExpanded}
                    aria-label={isDesktopRailExpanded ? "Recolher navegação" : "Expandir navegação"}
                    onClick={() => setIsDesktopRailExpanded((current) => !current)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border border-[color:var(--border)] bg-white/94 text-[color:var(--ink-muted)] transition-colors hover:border-[color:rgba(13,107,100,0.18)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-controls="desktop-nav-rail"
                  aria-expanded={isDesktopRailExpanded}
                  aria-label={isDesktopRailExpanded ? "Recolher navegação" : "Expandir navegação"}
                  onClick={() => setIsDesktopRailExpanded((current) => !current)}
                  className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border border-[color:var(--border)] bg-white/94 text-[color:var(--ink-muted)] transition-colors hover:border-[color:rgba(13,107,100,0.18)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}

              <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2">
                <NavigationLinks pathname={pathname} rail expanded={isDesktopRailExpanded} />
              </nav>
            </div>
          </div>
        </div>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:rgba(148,163,184,0.16)] bg-[color:rgba(243,239,228,0.96)] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
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
