import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpaProposicoesOrfas() {
    console.log("🧹 Iniciando Faxina no Banco de Dados...");

    try {
        // Encontra proposições sem qualquer voto registrado — nem definitivo
        // (voto_parlamentar) nem em tramitação (voto_parlamentar_tramitacao).
        const resultado = await prisma.proposicao.deleteMany({
            where: {
                votosParlamentar: { none: {} },
                votosTramitacao: { none: {} }
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
