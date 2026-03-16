"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/50 backdrop-blur-md border border-white/10 hover:bg-slate-800 transition-colors cursor-pointer"
        >
            <ChevronLeft className="w-6 h-6 text-white" />
        </button>
    );
}
