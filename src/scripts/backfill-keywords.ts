import { prisma } from "../lib/prisma"

/**
 * BACKFILL: Adiciona keywords às proposições que já estão no banco
 * mas foram salvas antes do campo keywords existir.
 * Roda em chunks de 10 com rate-limit protection.
 * Se parar, rode novamente — pula as que já têm keywords.
 */

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url)
            if (res.status === 429) {
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

async function backfillKeywords() {
    console.log("\n=============================================")
    console.log("🔑 BACKFILL: Keywords para proposições existentes")
    console.log("=============================================\n")

    // Pega apenas as proposições que ainda NÃO têm keywords
    const semKeywords = await prisma.proposicao.count({
        where: { keywords: null }
    })
    const totalProposicoes = await prisma.proposicao.count()
    
    console.log(`📊 Total no banco: ${totalProposicoes}`)
    console.log(`🔍 Sem keywords: ${semKeywords}`)
    console.log(`✅ Já com keywords: ${totalProposicoes - semKeywords}\n`)

    if (semKeywords === 0) {
        console.log("🎉 Todas as proposições já têm keywords! Nada a fazer.")
        await prisma.$disconnect()
        return
    }

    // Processa em lotes de 100 para não carregar tudo na memória
    const BATCH_SIZE = 100
    const CHUNK_API = 10
    let processadas = 0
    let atualizadas = 0
    let erros = 0

    while (true) {
        const batch = await prisma.proposicao.findMany({
            where: { keywords: null },
            select: { id: true },
            take: BATCH_SIZE,
        })

        if (batch.length === 0) break

        // Busca keywords em chunks de 10
        for (let i = 0; i < batch.length; i += CHUNK_API) {
            const chunk = batch.slice(i, i + CHUNK_API)

            await Promise.all(chunk.map(async (p) => {
                try {
                    const data = await fetchWithRetry(
                        `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${p.id}`
                    )
                    const keywords = data.dados?.keywords || null

                    // Atualiza com keywords (mesmo que seja null - para não reprocessar)
                    await prisma.proposicao.update({
                        where: { id: p.id },
                        data: { keywords: keywords || "" } // "" = sem keywords, mas não null (para não reprocessar)
                    })
                    atualizadas++
                    process.stdout.write(".")
                } catch (err) {
                    erros++
                    process.stdout.write("x")
                }
            }))

            processadas += chunk.length
            await sleep(600)
        }

        console.log(`\n   💾 ${processadas} processadas até agora (${atualizadas} atualizadas, ${erros} erros)`)
    }

    const restantes = await prisma.proposicao.count({ where: { keywords: null } })
    console.log(`\n============================`)
    console.log(`✅ BACKFILL CONCLUÍDO!`)
    console.log(`   Atualizadas: ${atualizadas}`)
    console.log(`   Erros: ${erros}`)
    console.log(`   Ainda sem keywords: ${restantes}`)
    console.log(`============================\n`)

    await prisma.$disconnect()
}

backfillKeywords().catch(async (err) => {
    console.error("❌ ERRO FATAL:", err)
    await prisma.$disconnect()
    process.exit(1)
})
