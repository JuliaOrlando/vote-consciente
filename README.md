# Vote Consciente

Aplicação web para acompanhar e investigar a atuação dos deputados federais brasileiros — votos, proposições, gastos e comissões — com base nos dados oficiais da Câmara dos Deputados.

## O problema

Os dados de votações, gastos e proposições da Câmara são públicos, mas vivem em uma API técnica e em fichas de tramitação difíceis de ler. Na prática, o eleitor não tem como saber, de forma simples, como o deputado que ajudou a eleger realmente votou nos temas que importam para ele. Sem isso, cobrar representação vira opinião, não fato.

## O que a aplicação faz

Reúne os dados oficiais em um só lugar e os torna legíveis:

- **Perfil do parlamentar** — votos, proposições de autoria, gastos da cota parlamentar e comissões.
- **Meu Match** — você responde como votaria em proposições reais e o app calcula sua afinidade com cada deputado, projeto a projeto, mostrando onde vocês concordam ou divergem.
- **Acompanhar** — siga deputados específicos e centralize o que interessa no seu perfil.

A premissa é honestidade de dados: só aparece o que tem origem oficial e verificável. Votações sem resultado definitivo são marcadas como provisórias, e nenhum número é estimado ou inventado para preencher lacunas.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Tailwind CSS**
- Autenticação própria por e-mail/senha (bcrypt + JWT em cookie `httpOnly`)

## Rodando localmente

### 1. Instalar

```bash
git clone https://github.com/JuliaOrlando/vote-consciente.git
cd vote-consciente
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

- **`DATABASE_URL`** — conexão PostgreSQL (local, Neon, Supabase, etc.).
- **`AUTH_SECRET`** — segredo para assinar as sessões. Gere um com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **`RESEND_API_KEY`** *(opcional)* — envio real dos e-mails de redefinição de senha via [Resend](https://resend.com). Sem ela, o link é apenas impresso no console do servidor (suficiente em desenvolvimento).

### 3. Banco de dados

```bash
npx prisma generate
npx prisma db push
```

### 4. Popular com dados reais

Os scripts extraem dados da API da Câmara. Rode na ordem:

```bash
npx ts-node src/scripts/seed-deputados.ts          # deputados
npx ts-node src/scripts/update-fotos.ts            # fotos
npx ts-node src/scripts/seed-todas-proposicoes.ts  # proposições
npx ts-node src/scripts/seed-votos.ts              # votos (resultado definitivo de cada proposição)
npx ts-node src/scripts/seed-comissoes.ts          # comissões (opcional)
```

### 5. Rodar

```bash
npm run dev
```

Disponível em [http://localhost:3000](http://localhost:3000).

## Dados

Fonte única: [API de Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/). Os votos exibidos e o cálculo de afinidade usam apenas o resultado definitivo de cada proposição; votações ainda em tramitação ficam armazenadas à parte e são sinalizadas como provisórias.
