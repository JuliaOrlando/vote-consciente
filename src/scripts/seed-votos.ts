import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CAMARA_API_URL = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchAndSeedVotos() {
    console.log("📥 Iniciando extração do Histórico Nominal de Votos da Câmara...");

    try {
        // 1. Pega todas as proposições que salvamos no banco
        const proposicoes = await prisma.proposicao.findMany();
        console.log(`Buscando votações para ${proposicoes.length} proposições cadastradas.`);

        let totalVotosInseridos = 0;

        for (const prop of proposicoes) {
            console.log(`\n🔍 Analisando Proposição [ID: ${prop.id}] - ${prop.numOficial}...`);

            // 2. Tenta descobrir se esta proposição já foi votada no Plenário
            const votacoesUrl = `${CAMARA_API_URL}/proposicoes/${prop.id}/votacoes`;
            const reqVotacoes = await fetch(votacoesUrl);

            if (!reqVotacoes.ok) {
                console.log(`⚠ Nenhuma ata de votação encontrada para ${prop.numOficial}`);
                continue;
            }

            const dataVotacoes = await reqVotacoes.json();
            const listaVotacoes = dataVotacoes.dados;

            if (!listaVotacoes || listaVotacoes.length === 0) {
                console.log(`⏳ Proposição ainda não teve votação nominal no plenário.`);
                continue;
            }

            // Para cada votação registrada (de trás para a frente para pegar a última decisão real)
            let inseridosNestaLei = 0;

            for (let i = listaVotacoes.length - 1; i >= 0; i--) {
                const votacaoId = listaVotacoes[i].id;
                const dataDaVotacao = listaVotacoes[i].data || new Date().toISOString();

                console.log(` \nTentando Sessão [Votação ID: ${votacaoId}]...`);

                const votosUrl = `${CAMARA_API_URL}/votacoes/${votacaoId}/votos`;
                const reqVotos = await fetch(votosUrl);

                if (!reqVotos.ok) continue;

                const dataVotos = await reqVotos.json();
                const registros = dataVotos.dados;

                // Se houver votos Nominais nesta sessão, é esta que usaremos
                if (registros && registros.length > 0) {
                    console.log(`✅ Sessão Nominal com ${registros.length} votos. Injetando no Banco...`);

                    for (const registro of registros) {
                        const depId = registro.deputado_.id;

                        let votoLimpado = registro.tipoVoto.trim().toUpperCase();
                        if (votoLimpado === 'NÃO') votoLimpado = 'NAO';

                        try {
                            await prisma.votoParlamentar.upsert({
                                where: {
                                    parlamentarId_proposicaoId: {
                                        parlamentarId: depId,
                                        proposicaoId: prop.id
                                    }
                                },
                                update: {
                                    voto: votoLimpado,
                                    dataVoto: new Date(dataDaVotacao)
                                },
                                create: {
                                    parlamentarId: depId,
                                    proposicaoId: prop.id,
                                    voto: votoLimpado,
                                    dataVoto: new Date(dataDaVotacao)
                                }
                            });
                            totalVotosInseridos++;
                            inseridosNestaLei++;
                        } catch (e) {
                            // Deputado não existe em nossa base (Licença/Suplente), ignoramos
                        }
                    }
                    break; // Se achou nominal para este PL, ignora sessões anteriores
                }
            }

            console.log(`🟢 ${inseridosNestaLei} votos processados para a ${prop.numOficial}.`);

            // Pausa de respeito (Rate Limit da API do Governo para não sermos bloqueados)
            await new Promise(r => setTimeout(r, 600));
        }

        console.log(`\n🎉 Processo Concluído! ${totalVotosInseridos} votos injetados no Motor de Match na Nuvem Neon.`);

    } catch (error) {
        console.error("❌ Falha crítica no Seeding de Votos:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchAndSeedVotos();
