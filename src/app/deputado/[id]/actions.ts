"use server"

import { prisma } from "@/lib/prisma"

export async function fetchProjetosAutorados(parlamentarId: number) {
    try {
        // Verificar se temos dados no banco (rota feliz - instantânea)
        const countLocal = await prisma.proposicaoAutor.count({
            where: { parlamentarId }
        })

        if (countLocal > 0) {
            // Temos dados em cache! Retorna do DB local diretamente.
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
            // Adapta o formato para o que o frontend espera
            return relacoes.map(r => ({
                ...r.proposicao,
                // Alias: o frontend usa `ementa`, o banco salva como `ementaOficial`
                ementa: r.proposicao.ementaOficial,
                statusProposicao: {
                    descricaoSituacao: r.proposicao.statusDescricao,
                }
            }))
        }

        // Fallback: nenhum dado no banco - busca da API (acontece apenas na primeira vez)
        console.log(`[actions] Sem dados em cache para ${parlamentarId}, buscando da API...`)
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

export async function fetchDespesasDetalhadas(parlamentarId: number) {
    try {
        // Pega as despesas mais recentes (ordem DESC por padrão na API para dados paginados, vamos pegar os últimos meses)
        // A API permite ordenar por dataDocumento DESC
        const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${parlamentarId}/despesas?ordem=DESC&ordenarPor=dataDocumento&itens=10`
        const response = await fetch(url, { next: { revalidate: 3600 } })

        if (!response.ok) {
            throw new Error("Falha ao buscar despesas detalhadas")
        }

        const data = await response.json()
        return data.dados // Array de despesas com fornecedor, valorLiquido, tipoDespesa
    } catch (error) {
        console.error("Erro em fetchDespesasDetalhadas:", error)
        return []
    }
}
