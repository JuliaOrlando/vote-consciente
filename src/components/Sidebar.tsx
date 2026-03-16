"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, BarChart2, Info, UserCheck, ShieldCheck } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Página inicial", href: "/", icon: Home },
        { name: "Meu Match", href: "/match", icon: UserCheck },
        { name: "Votações", href: "#", icon: ShieldCheck },
        { name: "Análises Especiais", href: "#", icon: BarChart2 },
        { name: "Sobre", href: "#", icon: Info },
    ];

    return (
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full flex-shrink-0">
            {/* Logo Area */}
            <div className="p-6 pb-8 border-b border-slate-800/50">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center relative overflow-hidden">
                        <div className="w-4 h-4 bg-emerald-400 rounded-full group-hover:scale-110 transition-transform"></div>
                    </div>
                    <span className="font-display font-bold text-lg text-white tracking-tight">
                        Vote Consciente
                    </span>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                            {link.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / User Badge */}
            <div className="p-4 border-t border-slate-800/50">
                <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-3 border border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-400">VC</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">Cidadão Ativo</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Versão Alpha</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
