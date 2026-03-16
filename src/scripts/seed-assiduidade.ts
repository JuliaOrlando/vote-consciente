import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchAssiduidades() {
    console.log("📥 Iniciando sync de Assiduidade para os Deputados...");

    try {
        const deputados = await prisma.parlamentar.findMany({ select: { id: true } });
        console.log(`✅ Base local contém ${deputados.length} parlamentares.`);

        const CHUNK_SIZE = 10;
        for (let i = 0; i < deputados.length; i += CHUNK_SIZE) {
            const chunk = deputados.slice(i, i + CHUNK_SIZE);

            await Promise.all(
                chunk.map(async (dep) => {
                    // Como a API da câmara pode não ter um resumo consolidado de presenças de forma simples (exige iterar N reuniões),
                    // usaremos um algoritmo previsível e determinístico baseado no ID do parlamentar para fins de demonstração
                    // realística no app, conforme aprovado no plano.

                    const deterministicPresentes = (dep.id % 60) + 180; // 180 a 240
                    const deterministicFaltasJust = (dep.id % 15);      // 0 a 14
                    const deterministicFaltasNaoJust = (dep.id % 5);    // 0 a 4

                    return prisma.assiduidadeParlamentar.upsert({
                        where: { parlamentarId: dep.id },
                        update: {
                            sessoesPresente: deterministicPresentes,
                            faltasJustificadas: deterministicFaltasJust,
                            ausenciasNaoJustificadas: deterministicFaltasNaoJust
                        },
                        create: {
                            parlamentarId: dep.id,
                            sessoesPresente: deterministicPresentes,
                            faltasJustificadas: deterministicFaltasJust,
                            ausenciasNaoJustificadas: deterministicFaltasNaoJust
                        }
                    });
                })
            );
            console.log(`⏳ Processado lote assiduidade ${Math.min(i + CHUNK_SIZE, deputados.length)} de ${deputados.length}...`);
        }

        console.log("🎉 Seed de Assiduidades finalizado com sucesso.");

    } catch (error) {
        console.error("❌ Falha na sincronização de Assiduidade:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchAssiduidades();
