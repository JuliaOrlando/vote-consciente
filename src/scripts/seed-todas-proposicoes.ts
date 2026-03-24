import { prisma } from "../lib/prisma"

/**
 * SEED: Todas as proposições de todos os deputados
 *
 * Características:
 * - Retomada automática: se parar e rodar de novo, continua de onde parou
 * - Rate-limit safe: chunks de 5 com delays
 * - Processo em background: o site continua funcionando normalmente
 */

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url)
            if (res.status === 429) {
                console.log(`   ⚠️  Rate limit, aguardando 5s...`)
                await sleep(5000)
                continue
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.json()
        } catch (e) {
            if (i === retries - 1) throw e
            await sleep(1500)
        }
    }
}

async function seedProjetosDeputado(parlamentarId: number, nome: string) {
    // Checa se já tem dados para esse deputado (retomada automática)
    const jaExiste = await prisma.proposicaoAutor.count({
        where: { parlamentarId }
    })
    if (jaExiste > 0) {
        return { salvos: jaExiste, aprovadas: 0, pulou: true }
    }

    let allProposicoes: any[] = []
    
    // Puxa até 5 páginas (500 proposições) por deputado
    for (let page = 1; page <= 5; page++) {
        const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${parlamentarId}&siglaTipo=PL&siglaTipo=PEC&ordem=DESC&ordenarPor=ano&itens=100&pagina=${page}`
        
        try {
            const data = await fetchWithRetry(url)
            if (!data.dados || data.dados.length === 0) break
            allProposicoes.push(...data.dados)
            if (data.dados.length < 100) break // última página
            await sleep(400)
        } catch (e) {
            break
        }
    }

    if (allProposicoes.length === 0) return { salvos: 0, aprovadas: 0, pulou: false }

    // Remove duplicados
    const uniqueMap = new Map()
    for (const p of allProposicoes) uniqueMap.set(p.id, p)
    const proposicoes = Array.from(uniqueMap.values())

    // Busca detalhes em chunks de 5
    const detalhadas: any[] = []
    let aprovadas = 0

    for (let i = 0; i < proposicoes.length; i += 5) {
        const chunk = proposicoes.slice(i, i + 5)
        const results = await Promise.all(chunk.map(async (p: any) => {
            try {
                const d = await fetchWithRetry(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${p.id}`)
                return d.dados
            } catch {
                return p
            }
        }))
        detalhadas.push(...results)
        await sleep(600)
    }

    // Salva no banco
    let salvos = 0
    for (const p of detalhadas) {
        if (!p || !p.id || !p.siglaTipo) continue
        
        const situacaoDesc = p.statusProposicao?.descricaoSituacao || 
                             p.ultimoStatus?.descricaoSituacao || "Em tramitação"
        const status = situacaoDesc.toLowerCase()
        if (status.includes('aprovad') || status.includes('transformado em norma') || 
            status.includes('sancionad')) aprovadas++

        try {
            await prisma.proposicao.upsert({
                where: { id: p.id },
                update: {
                    siglaTipo: p.siglaTipo || 'PL',
                    numero: p.numero || 0,
                    ano: p.ano || new Date().getFullYear(),
                    numOficial: `${p.siglaTipo} ${p.numero}/${p.ano}`,
                    dataApresentacao: p.dataApresentacao ? new Date(p.dataApresentacao) : null,
                    ementaOficial: p.ementa || p.ementaDetalhada || "Sem ementa",
                    keywords: p.keywords || null,
                    statusDescricao: situacaoDesc,
                    idSituacao: p.idSituacao || null,
                },
                create: {
                    id: p.id,
                    siglaTipo: p.siglaTipo || 'PL',
                    numero: p.numero || 0,
                    ano: p.ano || new Date().getFullYear(),
                    numOficial: `${p.siglaTipo} ${p.numero}/${p.ano}`,
                    dataApresentacao: p.dataApresentacao ? new Date(p.dataApresentacao) : null,
                    ementaOficial: p.ementa || p.ementaDetalhada || "Sem ementa",
                    keywords: p.keywords || null,
                    statusDescricao: situacaoDesc,
                    idSituacao: p.idSituacao || null,
                }
            })

            await prisma.proposicaoAutor.upsert({
                where: { proposicaoId_parlamentarId: { proposicaoId: p.id, parlamentarId } },
                update: {},
                create: { proposicaoId: p.id, parlamentarId }
            })
            salvos++
        } catch (err: any) {
            // Ignora erros individuais silenciosamente
        }
    }

    return { salvos, aprovadas, pulou: false }
}

async function seedTodasProposicoes() {
    console.log("\n====================================================")
    console.log("🚀 SEED: Proposições de TODOS os Deputados")
    console.log("====================================================")
    console.log("ℹ️  Este processo pode levar várias horas.")
    console.log("ℹ️  Se parar, rode novamente — ele continuará de onde parou.\n")

    const todos = await prisma.parlamentar.findMany({
        select: { id: true, nomeEleitoral: true },
        orderBy: { nomeEleitoral: 'asc' }
    })

    console.log(`📋 Total de deputados no banco: ${todos.length}\n`)

    let totalDeputadosProcessados = 0
    let totalSalvos = 0
    let totalAprovadas = 0
    let totalPulados = 0

    for (const dep of todos) {
        totalDeputadosProcessados++
        process.stdout.write(`[${totalDeputadosProcessados}/${todos.length}] ${dep.nomeEleitoral.padEnd(30)} → `)

        try {
            const resultado = await seedProjetosDeputado(dep.id, dep.nomeEleitoral)
            
            if (resultado.pulou) {
                process.stdout.write(`✅ já sincronizado (${resultado.salvos} PL/PECs)\n`)
                totalPulados++
            } else {
                process.stdout.write(`💾 ${resultado.salvos} salvos, ${resultado.aprovadas} aprovadas\n`)
                totalSalvos += resultado.salvos
                totalAprovadas += resultado.aprovadas
            }
        } catch (err) {
            process.stdout.write(`❌ Erro, pulando...\n`)
        }

        // Pausa entre deputados para não sobrecarregar a API
        await sleep(1000)

        // Log de progresso a cada 50 deputados
        if (totalDeputadosProcessados % 50 === 0) {
            const totalProposicoes = await prisma.proposicao.count()
            console.log(`\n--- PROGRESSO: ${totalDeputadosProcessados}/${todos.length} deputados | ${totalProposicoes} proposições no banco ---\n`)
        }
    }

    const totalProposicoes = await prisma.proposicao.count()
    const totalRelacoes = await prisma.proposicaoAutor.count()

    console.log("\n====================================================")
    console.log("🎉 SEED COMPLETO!")
    console.log(`   📊 Deputados processados: ${totalDeputadosProcessados}`)
    console.log(`   📄 Proposições no banco: ${totalProposicoes}`)
    console.log(`   🔗 Relações autor-proposição: ${totalRelacoes}`)
    console.log(`   🏆 Aprovadas identificadas: ${totalAprovadas}`)
    console.log(`   ⏭️  Deputados já sync (pulados): ${totalPulados}`)
    console.log("====================================================\n")

    await prisma.$disconnect()
}

seedTodasProposicoes().catch(async (err) => {
    console.error("\n❌ ERRO FATAL:", err)
    await prisma.$disconnect()
    process.exit(1)
})
