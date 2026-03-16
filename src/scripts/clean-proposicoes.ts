import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpaProposicoesOrfas() {
    console.log("🧹 Iniciando Faxina no Banco de Dados...");

    try {
        // Encontra proposições que possuem zero relação na tabela de Votos
        const resultado = await prisma.proposicao.deleteMany({
            where: {
                votosParlamentar: {
                    none: {}
                }
            }
        });

        console.log(`✅ Sucesso: ${resultado.count} proposições órfãs (sem votos em plenário) foram deletadas da Nuvem.`);
    } catch (error) {
        console.error("❌ Falha na limpeza:", error);
    } finally {
        await prisma.$disconnect();
    }
}

limpaProposicoesOrfas();
