"use server"

import type { Prisma } from "@prisma/client"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

const getCachedDeputadosDirectory = unstable_cache(
    async () => {
        const totalLocal = await prisma.parlamentar.count()

        if (totalLocal < 100) {
            return (await searchDeputadosAPI("", "all", "all", 0, 600)).data
        }

        return prisma.parlamentar.findMany({
            orderBy: { nomeEleitoral: 'asc' }
        })
    },
    ["deputados-directory-v1"],
    { revalidate: 3600 }
)

export async function getDeputadosDirectory() {
    try {
        return await getCachedDeputadosDirectory()
    } catch (error) {
        console.error("Erro ao carregar diretório de deputados:", error)
        return []
    }
}

export async function searchDeputados(
    query: string = "",
    estado: string = "",
    partido: string = "",
    skip: number = 0,
    take: number = 20
) {
    try {
        const termo = query.trim()

        // Se o banco tiver poucos dados (<100), usa a API da Câmara diretamente
        const totalLocal = await prisma.parlamentar.count()
        if (totalLocal < 100) {
            return await searchDeputadosAPI(termo, estado, partido, skip, take)
        }

        // Banco populado: usa Prisma para busca rápida local
        const whereClause: Prisma.ParlamentarWhereInput = {}

        if (termo.length >= 2) {
            whereClause.OR = [
                { nomeEleitoral: { contains: termo, mode: 'insensitive' } },
                { partido: { contains: termo, mode: 'insensitive' } },
                { uf: { contains: termo, mode: 'insensitive' } }
            ]
        }

        if (estado && estado !== "all") whereClause.uf = estado
        if (partido && partido !== "all") whereClause.partido = partido

        const [data, total] = await Promise.all([
            prisma.parlamentar.findMany({
                where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
                skip,
                take,
                orderBy: { nomeEleitoral: 'asc' }
            }),
            prisma.parlamentar.count({
                where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            })
        ])

        return { data, total }
    } catch (error) {
        console.error("Erro na busca de deputados:", error)
        return await searchDeputadosAPI(query.trim(), estado, partido, skip, take)
    }
}

async function searchDeputadosAPI(
    termo: string,
    estado: string,
    partido: string,
    skip: number,
    take: number
) {
    try {
        const page = Math.floor(skip / take) + 1
        const params = new URLSearchParams({
            ordem: 'ASC',
            ordenarPor: 'nome',
            itens: String(take),
            pagina: String(page),
        })

        if (termo.length >= 2) params.set('nome', termo)
        if (estado && estado !== "all") params.set('siglaUf', estado)
        if (partido && partido !== "all") params.set('siglaPartido', partido)

        const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?${params.toString()}`
        const res = await fetch(url, { next: { revalidate: 3600 } })

        if (!res.ok) throw new Error(`API error: ${res.status}`)

        const json = await res.json()
        type ApiDeputado = {
            id: number
            nome: string
            siglaPartido: string
            siglaUf: string
            urlFoto?: string | null
        }

        type ApiLink = {
            rel?: string
            href?: string
        }

        const dados = (json.dados || []) as ApiDeputado[]

        const data = dados.map((d) => ({
            id: d.id,
            nomeEleitoral: d.nome,
            partido: d.siglaPartido,
            uf: d.siglaUf,
            statusMandato: 'Ativo',
            urlFoto: d.urlFoto || null,
            matchGlobal: null,
        }))

        const linkHeader = ((json.links || []) as ApiLink[]).find((link) => link.rel === 'last')?.href || ''
        let total = skip + dados.length
        if (linkHeader) {
            const match = linkHeader.match(/pagina=(\d+)/)
            if (match) total = parseInt(match[1]) * take
        }

        return { data, total }
    } catch (err) {
        console.error("Erro na busca da API da Câmara:", err)
        return { data: [], total: 0 }
    }
}
