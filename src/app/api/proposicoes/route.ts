import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const proposicoes = await prisma.proposicao.findMany({
            orderBy: {
                rankingRelevancia: 'desc'
            },
            take: 10 // O eleitor lidará com um deck de no máximo 10 cards por sessão no MVP
        });

        return NextResponse.json({ success: true, dados: proposicoes });
    } catch (error) {
        console.error("Erro ao buscar proposições:", error);
        return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
    }
}
