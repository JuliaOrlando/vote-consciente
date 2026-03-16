import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Recebe os votos do App (Simulador)
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { usuarioId, votosCidadao } = payload;
        // votosCidadao: { proposicaoId: 123, voto: 'SIM' | 'NAO' | 'PULAR' }[]

        if (!votosCidadao || !Array.isArray(votosCidadao)) {
            return NextResponse.json({ error: "Votos do Cidadão ausentes ou inválidos." }, { status: 400 });
        }

        // Filtramos para não pontuar nem penalizar o parlamentar caso o cidadão não conheça o projeto.
        const votosValidos = votosCidadao.filter(v => v.voto !== "PULAR");

        if (votosValidos.length === 0) {
            return NextResponse.json({ error: "É necessário ao menos um posicionamento claro (SIM/NÃO) para o cálculo." }, { status: 400 });
        }

        const idsPropostas = votosValidos
            .map(v => parseInt(v.proposicaoId, 10))
            .filter(id => !isNaN(id));

        if (idsPropostas.length === 0) {
            return NextResponse.json({ error: "IDs de proposições inválidos submetidos." }, { status: 400 });
        }

        // Puxamos de uma vez todos os parlamentares e cruzamos apenas os IDs dessas propostas
        // Lógica de Retry para Cold Start do Banco de Dados Neon (Serverless)
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
                break; // Sucesso, sai do loop
            } catch (err: unknown) {
                console.warn(`Neon DB Sleep Timeout. Retentando em 2s... Tentativas restantes: ${retries - 1}`);
                retries -= 1;
                if (retries === 0) throw err;
                // Espera 2 segundos para o cluster acordar
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!deputados) {
            throw new Error("Não foi possível acessar a base governamental após 3 tentativas.");
        }

        // Motor:
        // Iteramos cada deputado e cada voto correspondente.
        // Se ambos == SIM ou ambos == NAO => Match = 100% naquela lei
        // Se Deputado == ABSTENCAO/OBSTRUCAO => Match = 0% naquela lei (não decidiu na pauta)
        // Se Ambos inversos => Match = -100%

        const ranking = deputados.map(dep => {
            let scoreSoma = 0;
            let leisMensuradas = 0;

            votosValidos.forEach(votoUsuario => {
                const votoParlamentar = dep.votos.find(v => v.proposicaoId === parseInt(votoUsuario.proposicaoId));

                if (votoParlamentar) {
                    leisMensuradas++;
                    const parseCidadao = votoUsuario.voto.toUpperCase();
                    const parseParla = votoParlamentar.voto.toUpperCase();

                    if (parseCidadao === parseParla) {
                        scoreSoma += 1;
                    } // Discordância pura deduz -1 (exceto se a abstenção for analisada, que por hora é peso 0 para não arruinar precisão)
                }
            });

            // Se o parlamentar não votou em absolutamente nada da lista escolhida, zero.
            const rawScore = leisMensuradas > 0 ? (scoreSoma / leisMensuradas) : 0;
            // Limitamos a escala entre 0% e 100% para visual limpo.
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

        // Sort Top Matches
        const topMatches = ranking.sort((a, b) => b.pontos - a.pontos).slice(0, 100);

        return NextResponse.json({ matches: topMatches }, { status: 200 });

    } catch (e: unknown) {
        console.error("Match Engine Crashed:", e);
        if (e instanceof Error) {
            return NextResponse.json({ error: "Crash no motor relacional: " + e.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Crash inesperado no motor." }, { status: 500 });
    }
}
