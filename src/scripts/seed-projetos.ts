import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Script para Sincronizar Projetos de um ou mais deputados
// Isso evita usar a API da Câmara ao vivo e protege contra Rate Limits

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url)
            if (!res.ok) {
                if (res.status === 429) {
                    console.log(`Rate limit atingido, esperando 2 segundos... (Tentativa ${i + 1}/${retries})`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return await res.json()
        } catch (e) {
            if (i === retries - 1) throw e;
            console.log(`Erro de rede, aguardando 1s... (Tentativa ${i + 1}/${retries})`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

async function seedProjetos(parlamentarId: number) {
    console.log(`\n========================================`);
    console.log(`🔄 Iniciando sincronização do Deputado ID: ${parlamentarId}`);
    console.log(`========================================\n`);

    try {
        // ─── 0. GARANTIR QUE O PARLAMENTAR EXISTE NO BANCO ─────────────────────
        console.log(`📋 Verificando e sincronizando o Parlamentar no banco...`)
        const depData = await fetchWithRetry(`https://dadosabertos.camara.leg.br/api/v2/deputados/${parlamentarId}`)
        const dep = depData.dados
        if (dep) {
            await prisma.parlamentar.upsert({
                where: { id: parlamentarId },
                update: {
                    nomeEleitoral: dep.ultimoStatus?.nomeEleitoral || dep.nome,
                    partido: dep.ultimoStatus?.siglaPartido || 'Sem Partido',
                    uf: dep.ultimoStatus?.siglaUf || 'XX',
                    statusMandato: dep.ultimoStatus?.situacao || 'Ativo',
                    urlFoto: dep.ultimoStatus?.urlFoto || null,
                },
                create: {
                    id: parlamentarId,
                    nomeEleitoral: dep.ultimoStatus?.nomeEleitoral || dep.nome,
                    partido: dep.ultimoStatus?.siglaPartido || 'Sem Partido',
                    uf: dep.ultimoStatus?.siglaUf || 'XX',
                    statusMandato: dep.ultimoStatus?.situacao || 'Ativo',
                    urlFoto: dep.ultimoStatus?.urlFoto || null,
                }
            })
            console.log(`✅ Parlamentar "${dep.ultimoStatus?.nomeEleitoral}" confirmado no banco!`)
        }

        // ─── 1. BUSCAR TODAS AS PROPOSIÇÕES ───────────────────────────────────
        let allProposicoes: any[] = [];
        const perPage = 100;
        const maxPages = 5; // Pega as ultimas 500 (ate uns 5-6 anos atras)
        
        for (let page = 1; page <= maxPages; page++) {
            console.log(`\n📥 Buscando Página ${page} (Itens ${perPage}) da lista geral...`);
            const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${parlamentarId}&siglaTipo=PL&siglaTipo=PEC&ordem=DESC&ordenarPor=ano&itens=${perPage}&pagina=${page}`
            
            const data = await fetchWithRetry(url);
            
            if (!data.dados || data.dados.length === 0) {
                console.log("Fim da lista atingido.");
                break;
            }
            
            allProposicoes.push(...data.dados);
            await new Promise(r => setTimeout(r, 500)); // Delay Profilatico (Regra 2)
        }

        console.log(`\n📊 Total de Proposições Básicas Encontradas: ${allProposicoes.length}`);

        // Remove duplicados da lista API (se houver)
        const uniqueProposicoesMap = new Map()
        for (const p of allProposicoes) {
            if (!uniqueProposicoesMap.has(p.id)) {
                uniqueProposicoesMap.set(p.id, p)
            }
        }
        const proposicoesBasicas = Array.from(uniqueProposicoesMap.values())

        console.log(`🚀 Iniciando Chunking de Detalhamento [Chunk: 5] - Prevenindo Rate Limit...`);
        const proposicoesDetalhadas = []
        const chunkSize = 5 // Lote muito seguro!
        let aprovadasCounter = 0;

        for (let i = 0; i < proposicoesBasicas.length; i += chunkSize) {
            const chunk = proposicoesBasicas.slice(i, i + chunkSize);
            console.log(`   - Chunk ${i}/${proposicoesBasicas.length}...`);
            
            const detalhadasChunk = await Promise.all(
                chunk.map(async (p: any) => {
                    try {
                        const detailRes = await fetchWithRetry(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${p.id}`)
                        return detailRes.dados
                    } catch (e) {
                        console.error(`     X Erro ao detalhar ${p.id}. Saltando...`)
                        return p // Fallback p/ n quebrar tds
                    }
                })
            )
            
            proposicoesDetalhadas.push(...detalhadasChunk);
            // Delay agressivo profilático entre os lotes detalhados.
            await new Promise(r => setTimeout(r, 800)); 
            
            // Log aprovadas "On The Fly"
            detalhadasChunk.forEach(d => {
                const status = d.statusProposicao?.descricaoSituacao?.toLowerCase() || '';
                if(status.includes('aprovad') || status.includes('transformado em norma') || status.includes('sancionad') || d.idSituacao === 1140) {
                     aprovadasCounter++;
                     console.log(`      🏆 APROVADA IDENTIFICADA: ${d.siglaTipo} ${d.numero}/${d.ano}`);
                }
            })
        }

        console.log(`\n💾 Salvando/Atualizando ${proposicoesDetalhadas.length} projetos no Banco de Dados Postgres...`);

        // Agora salva tudo no banco Prisma usando upsert
        for (const p of proposicoesDetalhadas) {
            const dataApresentacao = p.dataApresentacao ? new Date(p.dataApresentacao) : null;
            const situacaoDesc = p.statusProposicao?.descricaoSituacao || p.ultimoStatus?.descricaoSituacao || "Em tramitação";
            const idSituacao = p.idSituacao || null;
            const ementa = p.ementa || p.ementaDetalhada || "Sem ementa";

            // UPSERT PROPOSIÇÃO (Cria ou atualiza)
            await prisma.proposicao.upsert({
                where: { id: p.id },
                update: {
                    siglaTipo: p.siglaTipo,
                    numero: p.numero,
                    ano: p.ano,
                    numOficial: `${p.siglaTipo} ${p.numero}/${p.ano}`,
                    dataApresentacao: dataApresentacao,
                    ementaOficial: ementa,
                    statusDescricao: situacaoDesc,
                    idSituacao: idSituacao,
                },
                create: {
                    id: p.id,
                    siglaTipo: p.siglaTipo,
                    numero: p.numero,
                    ano: p.ano,
                    numOficial: `${p.siglaTipo} ${p.numero}/${p.ano}`,
                    dataApresentacao: dataApresentacao,
                    ementaOficial: ementa,
                    statusDescricao: situacaoDesc,
                    idSituacao: idSituacao,
                }
            })

            // UPSERT RELACIONAMENTO (ProposicaoAutor)
            // Se garantir q nao duplica a relacao
            await prisma.proposicaoAutor.upsert({
                where: {
                    proposicaoId_parlamentarId: {
                        proposicaoId: p.id,
                        parlamentarId: parlamentarId
                    }
                },
                update: {}, // Não faz nada se já existe
                create: {
                    proposicaoId: p.id,
                    parlamentarId: parlamentarId
                }
            })
        }

        console.log(`\n✅ Sincronização Finalizada! ${aprovadasCounter} Aprovadas históricas inseridas/checadas!`);

    } catch (error) {
        console.error("Erro Fatal no Seed:", error)
    } finally {
        await prisma.$disconnect()
    }
}

// Vamos rodar para Tabata Amaral (204534)
seedProjetos(204534);
