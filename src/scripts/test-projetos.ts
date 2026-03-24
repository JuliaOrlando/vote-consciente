async function fetchProjetosAutorados(parlamentarId: number) {
    console.log(`Buscando proposições para o parlamentar ID: ${parlamentarId}`);
    try {
        const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${parlamentarId}&siglaTipo=PL&siglaTipo=PEC&ordem=ASC&ordenarPor=ano&itens=100`;
        console.log(`Chamando URL: ${url}`);
        
        const response = await fetch(url);
        const data: any = await response.json();
        
        console.log(`✅ ${data.dados.length} Proposições encontradas no total.\n`);
        
        const propostasDetalhes = [];
        for (const prop of data.dados) {
            const detailRes = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${prop.id}`);
            if (!detailRes.ok) continue;
            const detailData: any = await detailRes.json();
            propostasDetalhes.push(detailData.dados);
            await new Promise(res => setTimeout(res, 50));
        }
        
        const uniqueStatuses = new Set<string>();
        propostasDetalhes.forEach(p => {
            const s = p.statusProposicao?.descricaoSituacao || p.ultimoStatus?.descricaoSituacao || 'Sem Status';
            uniqueStatuses.add(s);
        });
        
        console.log(`\n🔍 Status Únicos Encontrados nas 100 Proposições mais antigas:`);
        uniqueStatuses.forEach(s => console.log(`- ${s}`));
        
        const propostasAprovadas = propostasDetalhes.filter((p: any) => {
             const status = p.statusProposicao || p.ultimoStatus || {};
             const situacao = status.descricaoSituacao?.toLowerCase() || '';
             
             return situacao.includes('aprovad') || situacao.includes('transformado em norma') || situacao.includes('sancionad') || p.idSituacao === 1140;
        });

        console.log(`\n🟢 ${propostasAprovadas.length} Proposições filtradas como APROVADAS ou TRANSFORMADAS EM LEI:\n`);
        
        propostasAprovadas.forEach((prop: any, index: number) => {
            console.log(`[${index + 1}] ID: ${prop.id}`);
            console.log(`    Tipo: ${prop.siglaTipo} ${prop.numero}/${prop.ano}`);
            console.log(`    Status: ${prop.statusProposicao?.descricaoSituacao}`);
            console.log(`    Ementa: ${prop.ementa}`);
            console.log('-----------------------------------');
        });
        


    } catch (error) {
        console.error("Erro ao buscar projetos autorados:", error);
    }
}

const DEPUTY_ID = 204536; // Tabata Amaral
fetchProjetosAutorados(DEPUTY_ID);
