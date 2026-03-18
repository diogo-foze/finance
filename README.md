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
Execute o comando: docker-compose up -d --build