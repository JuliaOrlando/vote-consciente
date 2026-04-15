import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Motor de similaridade: compara votos do cidadão com os votos dos deputados
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { votosCidadao } = payload;

        if (!votosCidadao || !Array.isArray(votosCidadao)) {
            return NextResponse.json({ error: "Votos do Cidadão ausentes ou inválidos." }, { status: 400 });
        }

        // Puladas não influenciam o score, apenas SIM/NAO são considerados
        const votosValidos = votosCidadao.filter((v: { voto: string }) => v.voto !== "PULAR");

        if (votosValidos.length === 0) {
            return NextResponse.json({ error: "É necessário ao menos um posicionamento claro (SIM/NÃO) para o cálculo." }, { status: 400 });
        }

        const idsPropostas = votosValidos
            .map((v: { proposicaoId: string }) => parseInt(v.proposicaoId, 10))
            .filter((id: number) => !isNaN(id));

        if (idsPropostas.length === 0) {
            return NextResponse.json({ error: "IDs de proposições inválidos submetidos." }, { status: 400 });
        }

        // Retry para suportar cold start no banco serverless (Neon)
        let deputados = null;
        let retries = 3;
        while (retries > 0) {
            try {
                deputados = await prisma.parlamentar.findMany({
                    include: {
                        votos: {
                            where: { proposicaoId: { in: idsPropostas } }
                        }
                    }
                });
                break;
            } catch (err: unknown) {
                console.warn(`Banco indisponível. Retentando em 2s... Tentativas restantes: ${retries - 1}`);
                retries -= 1;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!deputados) {
            throw new Error("Não foi possível acessar a base governamental após 3 tentativas.");
        }

        // Pontuação: concordância = +1, discordância ou abstenção = 0
        const ranking = deputados.map(dep => {
            let scoreSoma = 0;
            let leisMensuradas = 0;

            votosValidos.forEach((votoUsuario: { proposicaoId: string; voto: string }) => {
                const votoParlamentar = dep.votos.find(v => v.proposicaoId === parseInt(votoUsuario.proposicaoId));

                if (votoParlamentar) {
                    leisMensuradas++;
                    if (votoUsuario.voto.toUpperCase() === votoParlamentar.voto.toUpperCase()) {
                        scoreSoma += 1;
                    }
                }
            });

            const rawScore = leisMensuradas > 0 ? (scoreSoma / leisMensuradas) : 0;
            const matchFormatado = Math.max(0, Math.round(rawScore * 100));

            return {
                id: dep.id,
                nome: dep.nomeEleitoral,
                partido: dep.partido,
                uf: dep.uf,
                pontos: matchFormatado,
                amostra: leisMensuradas
            };
        });

        const topMatches = ranking.sort((a, b) => b.pontos - a.pontos).slice(0, 100);

        return NextResponse.json({ matches: topMatches }, { status: 200 });

    } catch (e: unknown) {
        console.error("Erro no motor de match:", e);
        if (e instanceof Error) {
            return NextResponse.json({ error: "Falha no motor relacional: " + e.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Erro inesperado no motor." }, { status: 500 });
    }
}
