"use server"

import { prisma } from "@/lib/prisma"

// Busca projetos autorados pelo parlamentar — prioriza banco local, cai na API como fallback
export async function fetchProjetosAutorados(parlamentarId: number) {
    try {
        const countLocal = await prisma.proposicaoAutor.count({
            where: { parlamentarId }
        })

        if (countLocal > 0) {
            const relacoes = await prisma.proposicaoAutor.findMany({
                where: { parlamentarId },
                include: {
                    proposicao: {
                        select: {
                            id: true,
                            siglaTipo: true,
                            numero: true,
                            ano: true,
                            numOficial: true,
                            dataApresentacao: true,
                            ementaOficial: true,
                            statusDescricao: true,
                            idSituacao: true,
                        }
                    }
                },
                orderBy: {
                    proposicao: { ano: 'desc' }
                }
            })

            return relacoes.map(r => ({
                ...r.proposicao,
                ementa: r.proposicao.ementaOficial,
                statusProposicao: {
                    descricaoSituacao: r.proposicao.statusDescricao,
                }
            }))
        }

        // Fallback para a API pública da Câmara quando o banco ainda não tem dados
        const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${parlamentarId}&siglaTipo=PL&siglaTipo=PEC&ordem=DESC&ordenarPor=ano&itens=100`
        const response = await fetch(url, { next: { revalidate: 3600 } })
        if (!response.ok) throw new Error("Falha ao buscar proposicoes da API")
        const data = await response.json()
        return data.dados || []

    } catch (error) {
        console.error("Erro em fetchProjetosAutorados:", error)
        return []
    }
}

// Busca as últimas despesas detalhadas do parlamentar diretamente na API da Câmara
export async function fetchDespesasDetalhadas(parlamentarId: number) {
    try {
        const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${parlamentarId}/despesas?ordem=DESC&ordenarPor=dataDocumento&itens=10`
        const response = await fetch(url, { next: { revalidate: 3600 } })

        if (!response.ok) {
            throw new Error("Falha ao buscar despesas detalhadas")
        }

        const data = await response.json()
        return data.dados
    } catch (error) {
        console.error("Erro em fetchDespesasDetalhadas:", error)
        return []
    }
}
