"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui";

export function BackButton() {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => {
                if (window.history.length > 1) {
                    router.back();
                    return;
                }
                router.push("/parlamentares");
            }}
            className={buttonStyles({ variant: "ghost", size: "sm", className: "w-fit" })}
        >
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </button>
    );
}
