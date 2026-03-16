import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchComissoes() {
    console.log("📥 Iniciando extração de Órgãos e Comissões...");

    try {
        const deputados = await prisma.parlamentar.findMany({ select: { id: true } });
        console.log(`✅ Base local contém ${deputados.length} parlamentares.`);

        // Para a demonstração não demorar 2 horas puxando 513 deputados -> X órgãos iterativos reais,
        // limitaremos temporariamente e garantiremos carga.
        const CHUNK_SIZE = 5;

        for (let i = 0; i < deputados.length; i += CHUNK_SIZE) {
            const chunk = deputados.slice(i, i + CHUNK_SIZE);

            await Promise.all(
                chunk.map(async (dep) => {
                    const url = `${CAMARA_API_URL}/deputados/${dep.id}/orgaos`;
                    try {
                        const response = await fetch(url);
                        if (!response.ok) return;

                        const data = await response.json();
                        const orgaos = data.dados || [];

                        // Limpar comissões antigas do parlamentar antes de inserir novas para evitar duplicatas crônicas
                        await prisma.cargoComissao.deleteMany({
                            where: { parlamentarId: dep.id }
                        });

                        for (const org of orgaos) {
                            if (!org.siglaOrgao) continue;

                            await prisma.cargoComissao.create({
                                data: {
                                    parlamentarId: dep.id,
                                    orgao: org.nomeOrgao,
                                    siglaOrgao: org.siglaOrgao,
                                    tituloCargo: org.titulo,
                                    dataInicio: org.dataInicio ? new Date(org.dataInicio) : null
                                }
                            });
                        }
                    } catch (err) {
                        console.warn(`Aviso no Deputado ${dep.id}: `, err);
                    }
                })
            );
            console.log(`⏳ Processado lote de órgãos ${Math.min(i + CHUNK_SIZE, deputados.length)} de ${deputados.length}...`);
        }

        console.log("🎉 Seed de Comissões e Lideranças finalizado com sucesso.");

    } catch (error) {
        console.error("❌ Falha na sincronização de Comissões:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchComissoes();
