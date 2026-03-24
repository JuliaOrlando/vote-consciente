import { prisma } from "../lib/prisma"

// Script para popular TODOS os deputados ativos da Câmara no banco local
// Executa uma vez, depois a busca vem do banco diretamente (muito mais rápido!)

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url)
            if (!res.ok) {
                if (res.status === 429) {
                    console.log(`   ⚠️  Rate limit, aguardando 3s...`)
                    await sleep(3000)
                    continue
                }
                throw new Error(`HTTP ${res.status}`)
            }
            return await res.json()
        } catch (e) {
            if (i === retries - 1) throw e
            await sleep(1000)
        }
    }
}

async function seedTodosDeputados() {
    console.log("\n================================================")
    console.log("🔄 SEED: Populando TODOS os Deputados no Banco")
    console.log("================================================\n")

    let page = 1
    let totalSalvos = 0
    const perPage = 100

    while (true) {
        console.log(`📥 Buscando página ${page} (até ${perPage} deputados)...`)
        
        const data = await fetchWithRetry(
            `https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=${perPage}&pagina=${page}`
        )

        const deputados = data.dados || []
        if (deputados.length === 0) {
            console.log("   ✅ Fim da lista da Câmara!")
            break
        }

        console.log(`   👥 ${deputados.length} deputados obtidos, buscando detalhes...`)

        // Para cada deputado, pega detalhes básicos e faz upsert
        // Fazemos em lotes de 10 para não sobrecarregar a API
        const chunkSize = 10
        for (let i = 0; i < deputados.length; i += chunkSize) {
            const chunk = deputados.slice(i, i + chunkSize)
            
            await Promise.all(chunk.map(async (d: any) => {
                try {
                    // Tenta pegar detalhes completos com foto e status
                    const detail = await fetchWithRetry(
                        `https://dadosabertos.camara.leg.br/api/v2/deputados/${d.id}`
                    )
                    const dep = detail.dados

                    await prisma.parlamentar.upsert({
                        where: { id: d.id },
                        update: {
                            nomeEleitoral: dep.ultimoStatus?.nomeEleitoral || dep.nome || d.nome,
                            partido: dep.ultimoStatus?.siglaPartido || d.siglaPartido || "Sem Partido",
                            uf: dep.ultimoStatus?.siglaUf || d.siglaUf || "XX",
                            statusMandato: dep.ultimoStatus?.situacao || "Legislatura",
                            urlFoto: dep.ultimoStatus?.urlFoto || d.urlFoto || null,
                        },
                        create: {
                            id: d.id,
                            nomeEleitoral: dep.ultimoStatus?.nomeEleitoral || dep.nome || d.nome,
                            partido: dep.ultimoStatus?.siglaPartido || d.siglaPartido || "Sem Partido",
                            uf: dep.ultimoStatus?.siglaUf || d.siglaUf || "XX",
                            statusMandato: dep.ultimoStatus?.situacao || "Legislatura",
                            urlFoto: dep.ultimoStatus?.urlFoto || d.urlFoto || null,
                        }
                    })
                    process.stdout.write(".")
                } catch (err) {
                    // Se falhar no detalhe, salva com dados básicos da lista
                    await prisma.parlamentar.upsert({
                        where: { id: d.id },
                        update: {
                            nomeEleitoral: d.nome,
                            partido: d.siglaPartido || "Sem Partido",
                            uf: d.siglaUf || "XX",
                            statusMandato: "Legislatura",
                            urlFoto: d.urlFoto || null,
                        },
                        create: {
                            id: d.id,
                            nomeEleitoral: d.nome,
                            partido: d.siglaPartido || "Sem Partido",
                            uf: d.siglaUf || "XX",
                            statusMandato: "Legislatura",
                            urlFoto: d.urlFoto || null,
                        }
                    })
                    process.stdout.write("x")
                }
            }))

            totalSalvos += chunk.length
            await sleep(500) // pausa entre lotes
        }

        console.log(`\n   💾 Página ${page} concluída. Total acumulado: ${totalSalvos}`)

        // Checa se tem próxima página pelo link header
        const linkLast = data.links?.find((l: any) => l.rel === 'last')?.href || ''
        const matchLast = linkLast.match(/pagina=(\d+)/)
        const lastPage = matchLast ? parseInt(matchLast[1]) : page
        
        if (page >= lastPage) {
            console.log(`\n✅ Todas as ${lastPage} páginas processadas!`)
            break
        }

        page++
        await sleep(800) // pausa entre páginas
    }

    const total = await prisma.parlamentar.count()
    console.log(`\n🎉 SEED CONCLUÍDO! ${total} deputados no banco de dados!\n`)
    
    await prisma.$disconnect()
}

seedTodosDeputados().catch(err => {
    console.error("Erro fatal no seed:", err)
    process.exit(1)
})
