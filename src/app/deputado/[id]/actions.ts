"use server"

export async function fetchProjetosAutorados(parlamentarId: number) {
    try {
        const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idAutor=${parlamentarId}&siglaTipo=PL,PEC&ordem=DESC&ordenarPor=ano`
        const response = await fetch(url, { next: { revalidate: 3600 } })

        if (!response.ok) {
            throw new Error("Falha ao buscar proposições autoradas")
        }

        const data = await response.json()
        return data.dados // Array de proposições
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
