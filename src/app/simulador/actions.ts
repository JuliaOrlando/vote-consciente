"use server"

import { PrismaClient } from "@prisma/client"
import { unstable_cache } from "next/cache"

const prisma = new PrismaClient()

const getCachedProposicoes = unstable_cache(
    async () => prisma.proposicao.findMany({
        select: {
            id: true,
            siglaTipo: true,
            numero: true,
            ano: true,
            numOficial: true,
            ementaOficial: true,
            resumoCidadao: true,
            categoria: true,
            statusDescricao: true,
        },
        orderBy: [
            { rankingRelevancia: 'desc' },
            { ano: 'desc' },
            { id: 'desc' },
        ]
    }),
    ["simulador-proposicoes-base-v1"],
    { revalidate: 3600 }
)

export async function getProposicoesParaSimulador() {
    try {
        return await getCachedProposicoes();
    } catch (e: unknown) {
        console.error("Falha ao buscar proposições", e);
        return [];
    }
}
