"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getProposicoesParaSimulador() {
    try {
        // Traz as propostas ordenadas por relevância no BD (As mais impactantes ou polêmicas primeiro)
        const proposicoes = await prisma.proposicao.findMany({
            take: 10,
            orderBy: {
                rankingRelevancia: 'desc'
            }
        });

        return proposicoes;
    } catch (e: unknown) {
        console.error("Falha ao buscar proposições", e);
        return [];
    }
}
