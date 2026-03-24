import { prisma } from "../lib/prisma"

async function investigarErika() {
    // 1. Acha o ID da Erika Hilton no banco
    const erika = await prisma.parlamentar.findFirst({
        where: { nomeEleitoral: { contains: 'Erika Hilton', mode: 'insensitive' } }
    })
    
    if (!erika) {
        console.log("Erika Hilton NAO encontrada no banco!")
        
        // Tenta a API
        const res = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?nome=erika+hilton')
        const data: any = await res.json()
        console.log("Na API:", JSON.stringify(data.dados, null, 2))
        await prisma.$disconnect()
        return
    }
    
    console.log(`✅ Erika Hilton encontrada! ID: ${erika.id}, Partido: ${erika.partido}, UF: ${erika.uf}`)
    
    // 2. Conta quantas PLs ela tem no banco
    const totalPLs = await prisma.proposicaoAutor.count({
        where: { parlamentarId: erika.id }
    })
    console.log(`\n📄 Total de PLs/PECs no banco para ela: ${totalPLs}`)
    
    // 3. Busca por termos relacionados à escala 6x1
    const termosBusca = ['escala', '6x1', 'jornada', 'trabalho', 'semana']
    
    for (const termo of termosBusca) {
        const resultados = await prisma.proposicao.findMany({
            where: {
                autores: { some: { parlamentarId: erika.id } },
                ementaOficial: { contains: termo, mode: 'insensitive' }
            },
            select: { numOficial: true, ementaOficial: true, statusDescricao: true, ano: true }
        })
        
        if (resultados.length > 0) {
            console.log(`\n🔍 Resultados para "${termo}":`)
            resultados.forEach(r => {
                console.log(`  [${r.numOficial}] (${r.ano}) ${r.statusDescricao}`)
                console.log(`  Ementa: ${r.ementaOficial.substring(0, 150)}...`)
            })
        }
    }
    
    // 4. Mostra as PLs mais recentes para verificar se o banco está completo
    console.log("\n\n📅 Últimas 10 proposições da Erika Hilton no banco:")
    const ultimas = await prisma.proposicao.findMany({
        where: { autores: { some: { parlamentarId: erika.id } } },
        orderBy: { ano: 'desc' },
        take: 10,
        select: { numOficial: true, ano: true, ementaOficial: true, dataApresentacao: true }
    })
    ultimas.forEach(p => {
        console.log(`  [${p.numOficial}] ${p.dataApresentacao?.toISOString().split('T')[0] || p.ano}`)
        console.log(`    ${p.ementaOficial.substring(0, 100)}`)
    })
    
    // 5. Verifica na API diretamente se existe PL sobre escala 6x1
    console.log("\n\n🌐 Buscando na API da Câmara por proposições com 'escala' de 2024-2025...")
    const apiRes = await fetch(
        `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${erika.id}&palavrasChave=escala&itens=20`
    )
    const apiData: any = await apiRes.json()
    console.log(`API retornou ${apiData.dados?.length || 0} resultados para 'escala'`)
    apiData.dados?.forEach((p: any) => {
        console.log(`  [${p.siglaTipo} ${p.numero}/${p.ano}] ${p.ementa?.substring(0, 100)}`)
    })
    
    await prisma.$disconnect()
}

investigarErika()
