"use server"

import { PrismaClient } from "@prisma/client"

// Evita instanciar múltiplos clients em desenvolvimento
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function searchDeputados(
    query: string = "",
    estado: string = "",
    partido: string = "",
    skip: number = 0,
    take: number = 20
) {
    try {
        const termo = query.trim()

        // Constrói os filtros dinamicamente
        const whereClause: any = {}

        if (termo.length >= 2) {
            whereClause.OR = [
                { nomeEleitoral: { contains: termo, mode: 'insensitive' } },
                { partido: { contains: termo, mode: 'insensitive' } },
                { uf: { contains: termo, mode: 'insensitive' } }
            ]
        }

        if (estado && estado !== "all") {
            whereClause.uf = estado
        }

        if (partido && partido !== "all") {
            whereClause.partido = partido
        }

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
        return { data: [], total: 0 }
    }
}
