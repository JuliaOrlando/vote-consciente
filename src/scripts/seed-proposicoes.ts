import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchProposicoes() {
    console.log("📥 Iniciando extração de dados da Câmara dos Deputados...");

    // Buscamos apenas PECs (Propostas de Emenda) e PLs (Projetos de Lei) de 2022 pra frente que tenham sido votados (Aprovados ou afins)
    // codTipo: 139 = PL, 136 = PEC
    const url = `${CAMARA_API_URL}/proposicoes?ano=2022&codTipo=139&codTipo=136&ordem=DESC&ordenarPor=id&itens=100`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const propostas = data.dados;

        console.log(`✅ ${propostas.length} Proposições encontradas. Iniciando injeção no Banco (em blocos)...`);

        const CHUNK_SIZE = 50;
        for (let i = 0; i < propostas.length; i += CHUNK_SIZE) {
            const chunk = propostas.slice(i, i + CHUNK_SIZE);
            await Promise.all(
                chunk.map(async (prop: any) => {
                    if (!prop.ementa) return;

                    const categoria = prop.siglaTipo === 'PEC' ? 'ALTERAÇÃO CONSTITUCIONAL' : 'PROJETO DE LEI';

                    return prisma.proposicao.upsert({
                        where: { id: prop.id },
                        update: {
                            ementaOficial: prop.ementa,
                            resumoCidadao: prop.ementa,
                            apelidoIa: `${prop.siglaTipo} ${prop.numero}/${prop.ano}`
                        },
                        create: {
                            id: prop.id,
                            numOficial: `${prop.siglaTipo} ${prop.numero}/${prop.ano}`,
                            apelidoIa: `${prop.siglaTipo} ${prop.numero}/${prop.ano}`,
                            ementaOficial: prop.ementa,
                            resumoCidadao: prop.ementa,
                            categoria: categoria,
                            rankingRelevancia: 10
                        }
                    });
                })
            );
            console.log(`⏳ Processado lote ${Math.min(i + CHUNK_SIZE, propostas.length)} de ${propostas.length}...`);
        }

        console.log("🎉 Seed do Banco finalizado com sucesso. Dados oficiais injetados.");

    } catch (error) {
        console.error("❌ Falha na sincronização:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchProposicoes();
