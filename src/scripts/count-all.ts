
async function checkAllTabata() {
    console.log("Fetching ALL Tabata Amaral's propositions list...");
    const url = `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=204534&siglaTipo=PL&siglaTipo=PEC&ordem=DESC&ordenarPor=ano&itens=1000`;
    try {
        const res = await fetch(url);
        const data: any = await res.json();
        console.log(`Total propositions found: ${data.dados.length}`);
    } catch (e) {
        console.error(e);
    }
}
checkAllTabata();
