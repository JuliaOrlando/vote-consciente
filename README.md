# Vote Consciente

Um projeto Next.js que ajuda a acompanhar e investigar a atuação, votos e proposições dos deputados federais brasileiros.

## 🚀 Como rodar o projeto localmente

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/JuliaOrlando/vote-consciente.git
cd vote-consciente
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`:

```bash
cp .env.example .env
```
*(No Windows, você pode simplesmente copiar e colar o arquivo no Explorador de Arquivos e renomeá-lo para `.env`)*

Abra o arquivo `.env` e configure a variável **`DATABASE_URL`** com a URL do seu banco de dados PostgreSQL (pode ser um banco local, Supabase, NeonDB, etc.).
> ⚠️ **Atenção:** O projeto utiliza busca semântica, o que exige que o PostgreSQL utilizado tenha a extensão **`pgvector`** suportada.

### 3. Configurar o Banco de Dados (Prisma)

Com o banco de dados rodando e a URL configurada, instale o Prisma e sincronize a estrutura:

```bash
# Gera o Client do Prisma
npx prisma generate

# Empurra o schema (tabelas e extensões) pro banco de dados
npx prisma db push
```

### 4. Popular o banco de dados (Seeding)

Para o aplicativo funcionar com dados reais, utilizamos os scripts que extraem dados da API da Câmara e das demais fontes. Você pode executá-los em sequência:

```bash
# Baixa e popula políticos
npx ts-node src/scripts/seed-deputados.ts

# Carrega e atualiza as fotos
npx ts-node src/scripts/update-fotos.ts

# Popula projetos e proposições 
npx ts-node src/scripts/seed-todas-proposicoes.ts

# Popula presenças, assiduidades e comissões (opcional)
npx ts-node src/scripts/seed-assiduidade.ts
npx ts-node src/scripts/seed-comissoes.ts
```

### 5. Iniciar o servidor

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. O projeto estará rodando 🚀.

---

## 🛠️ Tecnologias Principais
- [Next.js](https://nextjs.org/) (App Router)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/) + `pgvector`
- [Tailwind CSS](https://tailwindcss.com/)
