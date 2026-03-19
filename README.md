"# finance"

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev -- -H 0.0.0.0
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

### Task List and Implementation Plan

- [x] Update Dashboard UI "Gestão de Usuários" card content
- [x] Improve Reports Page UX (Hover effects, Dynamic Chart interactions)
- [x] Add Glassmorphism tooltips to Reports charts
- [x] Implement active shape scaling for Pie Chart in Reports

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
 
## rodar o sistema em contêineres:

Dockerfile: Configurado para fazer o build otimizado da aplicação Next.js e rodar seu servidor customizado com suporte a WebSockets.
docker-compose.yml: Orquestra tanto a aplicação quanto o banco de dados MongoDB, com volume persistente para não perder dados ao reiniciar.
.env.example: Um modelo para você preencher com suas chaves de produção.
.dockerignore: Garante que arquivos desnecessários (como node_modules locais) não pesem na imagem Docker.
Como rodar no servidor:

Copie o arquivo .env.example para .env e preencha as variáveis.

> **⚠️ AJUSTE IMPORTANTE PARA O DOCKER:**
> Certifique-se de que a variável `MONGODB_URI` no seu arquivo `.env` esteja apontando para o nome do serviço do banco de dados no contêiner (`db`) e não para `localhost`.
> Ela deve ficar exatamente assim:
> `MONGODB_URI=mongodb://db:27017/finansys`

Após configurar o `.env`, execute o comando:
```bash
docker-compose up -d --build
```

## Executando em Produção (Node.js)

Para rodar o projeto em um ambiente de produção diretamente com o Node.js (sem utilizar contêineres), siga os passos abaixo certificando-se de ter configurado as variáveis de ambiente no arquivo `.env`:

1. Instale as dependências:
```bash
npm install
```

2. Faça o build da aplicação:
```bash
npm run build
```

3. Inicie o servidor em modo de produção:
```bash
npm start
```


## 📥 Backup e Restauração do Banco de Dados (MongoDB)

Mantenha seus dados seguros realizando backups periódicos.

### ☁️ MongoDB Atlas (Nuvem)
Para fazer o backup de um cluster na nuvem:
```bash
# Backup
mongodump --uri="mongodb+srv://<USUARIO>:<SENHA>@cluster0.mongodb.net/finansys" --out ./backup

# Restauração
mongorestore --uri="mongodb+srv://<USUARIO>:<SENHA>@cluster0.mongodb.net/finansys" --drop ./backup/finansys
```

### 💻 MongoDB Local (Sem instalar nada)
Como o projeto já possui as ferramentas necessárias, você pode gerar um backup completo do banco de dados (formatado para o Docker) rodando:

```bash
# Gera o arquivo ./docker-init/init-db.js
npm run backup
```

### 🛠️ Usando Ferramentas Externas (Opcional)
Se você tiver o **[Database Tools](https://www.mongodb.com/try/download/database-tools)** instalado no seu PATH e preferir o formato de despejo padrão (`.bson`):

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/finansys" --out ./backup

# Restauração
mongorestore --uri="mongodb://localhost:27017/finansys" --drop ./backup/finansys
```



### 🐳 Via Docker (Recomendado)
Se você estiver usando o `docker-compose` deste projeto:
```bash
# Backup (Cria a pasta 'backup' no diretório atual)
docker-compose exec db mongodump --archive --gzip --db finansys > backup_finansys.gz

# Restauração
cat backup_finansys.gz | docker-compose exec -T db mongorestore --archive --gzip --drop
```