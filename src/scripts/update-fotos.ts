import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Atualizando fotos oficiais na tabela Parlamentar...')

    // Buscar IDs de todos os parlamentares
    const parlamentares = await prisma.parlamentar.findMany({
        select: { id: true }
    })

    console.log(`Encontrados ${parlamentares.length} parlamentares para atualizar.`)

    let count = 0;
    for (const p of parlamentares) {
        // API padrão da Câmara para buscar fotos
        const baseUrl = `https://www.camara.leg.br/internet/deputado/bandep/${p.id}.jpg`

        await prisma.parlamentar.update({
            where: { id: p.id },
            data: { urlFoto: baseUrl }
        })

        count++;
        if (count % 100 === 0) console.log(`[+] Atualizado ${count} fotografias...`)
    }

    console.log('✅ Concluído! Todas as fotos foram associadas.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
