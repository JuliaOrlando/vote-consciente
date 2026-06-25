import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Pesos do match (fáceis de ajustar e explicar).
// O denominador é SEMPRE o total de votos claros do usuário; assim,
// discordar e não participar puxam a afinidade para baixo da mesma forma.
const PESO_CONCORDANCIA = 1; // deputado votou igual ao usuário
const PESO_NEUTRO = 0.15; // presente, mas não tomou o lado do usuário
// Discordância direta e ausência de registro valem 0.

// Votos "presente porém neutro": abstenção, obstrução e o presidente da sessão
// (Artigo 17, que pelo regimento não vota no mérito). Valores já normalizados
// (maiúsculas, sem acento) na ingestão. Ver src/scripts/seed-votos.ts.
const VOTOS_NEUTROS = new Set(["ABSTENCAO", "OBSTRUCAO", "ARTIGO 17"]);

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
        let idsDefinitivos: number[] = [];
        let retries = 3;
        while (retries > 0) {
            try {
                // Só entram no match as proposições cuja votação é DEFINITIVA
                // (votacaoFinalizada = true). Sessões intermediárias/procedimentais
                // (finalizada = false) são descartadas para não distorcer a afinidade.
                // Ver vault/data-sources/06_voting_definitive.md e seed-votos.ts.
                const propsDefinitivas = await prisma.proposicao.findMany({
                    where: { id: { in: idsPropostas }, votacaoFinalizada: true },
                    select: { id: true },
                });
                idsDefinitivos = propsDefinitivas.map((p) => p.id);

                deputados = await prisma.parlamentar.findMany({
                    // Apenas parlamentares em exercício entram no ranking de match.
                    // Inativos existem só para aparecer em votações históricas.
                    where: { ativo: true },
                    include: {
                        votos: {
                            where: { proposicaoId: { in: idsDefinitivos } }
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

        // Mantém apenas os votos do usuário sobre proposições com votação definitiva.
        const setDefinitivos = new Set(idsDefinitivos);
        const votosComparaveis = votosValidos.filter(
            (v: { proposicaoId: string }) => setDefinitivos.has(parseInt(v.proposicaoId, 10))
        );

        if (votosComparaveis.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "Nenhuma das proposições que você votou possui votação definitiva concluída. Selecione proposições já decididas em plenário para calcular o match.",
                },
                { status: 400 }
            );
        }

        if (!deputados) {
            throw new Error("Não foi possível acessar a base governamental após 3 tentativas.");
        }

        // Denominador fixo: total de posicionamentos claros do usuário (apenas
        // proposições com votação definitiva). Cada voto seu que o deputado NÃO
        // acompanha (discordância ou ausência) deixa de somar e reduz a afinidade.
        const totalUsuario = votosComparaveis.length;

        const ranking = deputados.map(dep => {
            let credito = 0;
            let emComum = 0; // proposições do match em que o deputado tem voto registrado

            votosComparaveis.forEach((votoUsuario: { proposicaoId: string; voto: string }) => {
                const votoParlamentar = dep.votos.find(v => v.proposicaoId === parseInt(votoUsuario.proposicaoId));

                // Ausência: não soma nada, mas continua no denominador (penaliza).
                if (!votoParlamentar) return;

                emComum++;
                const votoDep = votoParlamentar.voto.toUpperCase();

                if (VOTOS_NEUTROS.has(votoDep)) {
                    credito += PESO_NEUTRO; // presente, porém neutro
                } else if (votoUsuario.voto.toUpperCase() === votoDep) {
                    credito += PESO_CONCORDANCIA; // mesmo lado
                }
                // Discordância direta: crédito 0.
            });

            const rawScore = totalUsuario > 0 ? credito / totalUsuario : 0;
            const matchFormatado = Math.max(0, Math.min(100, Math.round(rawScore * 100)));

            return {
                id: dep.id,
                nome: dep.nomeEleitoral,
                partido: dep.partido,
                uf: dep.uf,
                pontos: matchFormatado,
                amostra: emComum,
                // Detalhe por proposição para a transparência "Ver como votou":
                // apenas as proposições do match em que o deputado tem voto registrado.
                votos: dep.votos.map((v) => ({ proposicaoId: v.proposicaoId, voto: v.voto })),
            };
        });

        // Ranking completo (sem corte): a paginação 15-a-15 acontece no cliente.
        // Desempate por cobertura (mais votos em comum primeiro).
        const matches = ranking.sort((a, b) => b.pontos - a.pontos || b.amostra - a.amostra);

        // `consideradas` informa ao cliente quais proposições entraram no cálculo
        // (votação definitiva), para sinalizar as que ficaram de fora por tramitação.
        return NextResponse.json({ matches, consideradas: idsDefinitivos }, { status: 200 });

    } catch (e: unknown) {
        console.error("Erro no motor de match:", e);
        if (e instanceof Error) {
            return NextResponse.json({ error: "Falha no motor relacional: " + e.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Erro inesperado no motor." }, { status: 500 });
    }
}
