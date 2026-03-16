import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchDeputados() {
    console.log("📥 Iniciando extração do quadro de Deputados em Exercício...");

    // Pegar todos ordenados alfabeticamente
    const url = `${CAMARA_API_URL}/deputados?ordem=ASC&ordenarPor=nome`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const deputados = data.dados;

        console.log(`✅ ${deputados.length} Parlamentares encontrados. Iniciando injeção no Banco em lotes...`);

        const CHUNK_SIZE = 50;
        for (let i = 0; i < deputados.length; i += CHUNK_SIZE) {
            const chunk = deputados.slice(i, i + CHUNK_SIZE);
            await Promise.all(
                chunk.map(async (dep: any) => {
                    return prisma.parlamentar.upsert({
                        where: { id: dep.id },
                        update: {
                            nomeEleitoral: dep.nome,
                            partido: dep.siglaPartido,
                            uf: dep.siglaUf,
                            statusMandato: "Em Mandato"
                        },
                        create: {
                            id: dep.id,
                            nomeEleitoral: dep.nome,
                            partido: dep.siglaPartido,
                            uf: dep.siglaUf,
                            statusMandato: "Em Mandato"
                        }
                    });
                })
            );
            console.log(`⏳ Processado lote ${Math.min(i + CHUNK_SIZE, deputados.length)} de ${deputados.length}...`);
        }

        console.log("🎉 Carga dos 513 Parlamentares finalizada com sucesso!");

    } catch (error) {
        console.error("❌ Falha na sincronização:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchDeputados();
