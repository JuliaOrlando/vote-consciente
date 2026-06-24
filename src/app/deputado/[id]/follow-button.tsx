"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Star } from "lucide-react";
import { buttonStyles } from "@/components/ui";
import { follow, getFollowState, unfollow } from "@/lib/acompanhamentos-client";

export function FollowButton({ parlamentarId }: { parlamentarId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [logado, setLogado] = useState(false);
  const [seguindo, setSeguindo] = useState(false);

  useEffect(() => {
    let active = true;
    getFollowState(parlamentarId).then((estado) => {
      if (!active) return;
      setLogado(estado.logado);
      setSeguindo(estado.seguindo);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [parlamentarId]);

  const handleClick = async () => {
    // Sem login: leva ao login e volta para este perfil.
    if (!logado) {
      router.push(`/login?redirect=/deputado/${parlamentarId}`);
      return;
    }

    setPending(true);
    const ok = seguindo ? await unfollow(parlamentarId) : await follow(parlamentarId);
    if (ok) setSeguindo((v) => !v);
    setPending(false);
  };

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className={buttonStyles({ variant: "secondary", size: "sm", className: "w-fit opacity-70" })}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Acompanhar
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={seguindo}
      className={buttonStyles({ variant: seguindo ? "primary" : "secondary", size: "sm", className: "w-fit" })}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : seguindo ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Star className="h-3.5 w-3.5" />
      )}
      {seguindo ? "Acompanhando" : "Acompanhar"}
    </button>
  );
}
