---

## 🔑 Autenticação

Todas as rotas (exceto as de registro e login inicial) exigem autenticação. O sistema suporta dois métodos:

1.  **Sessão de Navegador (Cookies)**: Gerenciada automaticamente pelo NextAuth para acesso via navegador.
2.  **Bearer Token (JWT)**: Para integrações externas ou clientes mobile.
    - **Como enviar**: Envie o token recebido no login via cabeçalho HTTP `Authorization`.
    - **Formato**: `Authorization: Bearer <SEU_TOKEN_JWT_AQUI>`
    - **Tipo de Token**: JWT assinado (algoritmo padrão do sistema).

---

## 🔐 Autenticação e Perfil

### `POST /api/auth/login`
Autenticação manual do usuário (com senha ou código temporário).
- **Corpo (Senha)**: `{ "email": "string", "password": "string" }`
- **Corpo (Código)**: `{ "email": "string", "code": "string" }`
- **Resposta**: Retorna um **Token JWT** e os dados do usuário. Perfeito para integrações externas e automações.

### `POST /api/auth/send-login-code` (Login sem Senha - Envio do Código)
Gera e envia por e-mail um código de acesso de 6 dígitos válido por 15 minutos.
- **Corpo**: `{ "email": "string" }`
- **Resposta**: `{ "message": "Código enviado com sucesso." }`
- **Nota**: Requer que as configurações de SMTP estejam devidamente cadastradas no banco de dados.

### `POST /api/auth/callback/code-credentials` (Login sem Senha - Autenticação)
Realiza a autenticação utilizando o e-mail e o código temporário recebido (gerenciado pelo NextAuth Provider `code-credentials`).
- **Corpo**: `{ "email": "string", "code": "string" }`
- **Uso no Client-Side (NextAuth)**:
  ```javascript
  const res = await signIn("code-credentials", {
    email: "usuario@exemplo.com",
    code: "123456",
    redirect: false
  });
  ```
- **Resposta**: Estabelece a sessão do usuário caso as credenciais estejam corretas e dentro do prazo de validade.


### `POST /api/auth/forgot-password`
Solicita um código de recuperação de senha por e-mail.
- **Corpo**: `{ "email": "string" }`
- **Resposta**: Mensagem de sucesso (independente se o e-mail existe, por segurança).

### `POST /api/auth/verify-code`
Verifica se o código de 6 dígitos enviado por e-mail é válido.
- **Corpo**: `{ "email": "string", "code": "string" }`
- **Resposta**: Confirmação de validade.

### `POST /api/auth/register`
Cria uma nova conta de usuário.
- **Corpo**: `{ "name": "string", "email": "string", "password": "string" }`
- **Regras**: Valida se o e-mail é único e se o cadastro externo está habilitado no painel administrativo.
- **Nota**: Envia um e-mail de boas-vindas com código de ativação de 6 dígitos.
- **Resposta**: Retorna o usuário criado com um `@username` gerado automaticamente.

### `POST /api/auth/verify-email`
Valida o e-mail do usuário e ativa a conta.
- **Corpo**: `{ "email": "string", "code": "string" }`
- **Nota**: O código deve ser o de 6 dígitos enviado por e-mail no cadastro.


### `POST /api/auth/reset-password`
Redefine a senha do usuário utilizando o código verificado.
- **Corpo**: `{ "email": "string", "code": "string", "newPassword": "string" }`

### `GET /api/users/profile`
Retorna os dados do perfil do usuário logado.

### `PATCH /api/users/profile`
Atualiza os dados do perfil (nome, username, imagem).
- **Corpo**: Aceita tanto `application/json` quanto `multipart/form-data` (para upload de fotos).
- **Campos**: `{ "name": "string", "username": "string", "image": "file" }`

---

## 💰 Gestão Financeira

### `GET /api/receitas` | `GET /api/despesas`
Lista as transações do usuário.
- **Query Params**:
  - `startDate`: Data inicial (YYYY-MM-DD)
  - `endDate`: Data final (YYYY-MM-DD)
- **Resposta**: Array de objetos de transação.

### `POST /api/receitas` | `POST /api/despesas`
Cria uma nova transação.
- **Corpo**: 
  ```json
  { 
    "descricao": "string", 
    "valor": number, 
    "data": "YYYY-MM-DD", 
    "categoria": "string", 
    "tipoMovimentacao": "Fixo | Variável",
    "status": "Planejado | Consolidado", (opcional, default: Planejado)
    "valorConsolidado": number, (opcional)
    "dataConsolidacao": "YYYY-MM-DD" (opcional)
  }
  ```

### `PUT /api/receitas` | `PUT /api/despesas`
Atualiza uma transação existente. Suporta consolidação parcial e parcelamento de saldo.
- **Corpo**:
  ```json
  {
    "id": "string",
    "descricao": "string",
    "valor": number,
    "data": "YYYY-MM-DD",
    "categoria": "string",
    "tipoMovimentacao": "Fixo | Variável",
    "status": "Planejado | Consolidado",
    "valorConsolidado": number,
    "dataConsolidacao": "YYYY-MM-DD",
    "parcelarRestante": boolean, (se true, divide o saldo em parcelas)
    "numeroParcelas": number (quantidade de parcelas para o saldo restante)
  }
  ```
- **Lógica de Divisão**: Se `valorConsolidado < valor` durante a transição de *Planejado* para *Consolidado*, a transação original é atualizada para o valor consolidado e novas transações "Restante" são criadas para a diferença.

### `DELETE /api/receitas` | `DELETE /api/despesas`
Remove uma transação.
- **Query Params**: `id=ID_DA_TRANSACAO`

---

---

## 👥 Gestão de Clientes

### `GET /api/clientes`
Lista todos os clientes vinculados ao usuário logado.
- **Resposta**: Array de objetos de cliente.

### `POST /api/clientes`
Cadastra um novo cliente. Suporta **CPF** (11 dígitos) e **CNPJ** (14 dígitos).
- **Auto-preenchimento**: Ao inserir um CNPJ válido, a interface utiliza a API `open.cnpja.com` para preencher automaticamente o nome, e-mail e telefone.
- **Corpo**: 
  ```json
  { 
    "nome": "string", 
    "cpf": "string", (CPF ou CNPJ)
    "dataNascimento": "YYYY-MM-DD", (opcional)
    "email": "string", (opcional)
    "telefone": "string",
    "limiteCredito": number,
    "ativo": number (0 | 1) // opcional, padrão 1
  }
  ```

### `PUT /api/clientes`
Atualiza os dados de um cliente existente.
- **Corpo**: `{ "id": "string", "nome": "string", ... }`

### `DELETE /api/clientes`
Remove um cliente.
- **Query Params**: `id=ID_DO_CLIENTE`

---

## 🚛 Gestão de Fornecedores

### `GET /api/fornecedores`
Lista todos os fornecedores vinculados ao usuário logado.
- **Query Params**: `all=true` (opcional, mostra inclusive os desativados).
- **Resposta**: Array de objetos de fornecedor, incluindo o campo calculado `creditoUtilizado` (soma das despesas planejadas vinculadas).

### `POST /api/fornecedores`
Cadastra um novo fornecedor. Suporta **CPF** e **CNPJ**.
- **Corpo**: 
  ```json
  { 
    "nome": "string", 
    "cpf": "string",
    "email": "string", (opcional)
    "telefone": "string",
    "limiteCredito": number,
    "ativo": number (0 | 1)
  }
  ```

### `PUT /api/fornecedores`
Atualiza os dados de um fornecedor existente.
- **Corpo**: `{ "id": "string", "nome": "string", ... }`

### `DELETE /api/fornecedores`
Altera o status de ativação do fornecedor (Ativa/Desativa).
- **Query Params**: `id=ID_DO_FORNECEDOR`

### `GET /api/fornecedores/despesas`
Busca todas as despesas planejadas vinculadas a um fornecedor específico.
- **Query Params**: `id=ID_DO_FORNECEDOR`
- **Resposta**: Array de despesas com status "Planejado".

---

## 📊 Dashboard e Relatórios

### `GET /api/dashboard/stats`
Retorna estatísticas detalhadas para o dashboard inicial.
- **Dados de Resumo**: 
  - `saldo`: Balanço consolidado total.
  - `receitas`/`despesas`: Totais planejados para o mês atual.
  - `receitasConsolidado`/`despesasConsolidado`: Totais efetivamente consolidados no mês.
  - `quebraCaixa`: Diferença negativa em receitas consolidadas.
  - `imprevistos`: Diferença positiva em despesas consolidadas.
  - `atrasosReceita`/`atrasosDespesa`: Valores planejados com data ultrapassada e não consolidados.
- **Gráficos**: Dados de performance dos últimos 6 meses (apenas consolidados).
- **Recentes**: Últimas 5 transações registradas.

### `POST /api/relatorios/email`
Envia o resumo financeiro do período solicitado para o e-mail do usuário.
- **Corpo**: `{ "month": "string", "year": number, "totalReceitas": number, "totalDespesas": number, "saldo": number }`

---

## 💬 Mensagens (Chat)

### `GET /api/messages`
Busca o histórico de mensagens entre o usuário logado e outro usuário.
- **Query Params**: `recipientId=ID_DO_DESTINATARIO`

### `POST /api/messages`
Envia uma nova mensagem.
- **Corpo**: `{ "receiverId": "string", "text": "string" }`

### `POST /api/messages/edit`
Edita uma mensagem enviada.
- **Corpo**: `{ "messageId": "string", "text": "string" }`
- **Regra**: Apenas mensagens enviadas nos últimos 120 segundos podem ser editadas.

### `POST /api/messages/delete`
Remove (soft-delete) uma mensagem enviada.
- **Corpo**: `{ "messageId": "string" }`
- **Regra**: Apenas mensagens enviadas nos últimos 120 segundos podem ser removidas.

### `POST /api/messages/read`
Marca mensagens como lidas em lote.
- **Corpo**: `{ "messageIds": ["id1", "id2", ...] }`

### `GET /api/messages/unread-count`
Retorna a quantidade total de mensagens não lidas para o usuário logado.

### `GET /api/messages/conversations`
Retorna a lista de conversas ativas do usuário com o último recado de cada uma.

---

## ⚙️ Administração (Admin Only)

### `GET /api/admin/config`
Lista todas as configurações do sistema (SMTP, Bloqueios, etc).

### `PATCH /api/admin/config`
Atualiza uma chave específica de configuração.
- **Corpo**: `{ "key": "string", "value": any }`

### `POST /api/admin/config/test-email`
Envia um e-mail de teste para validar os dados SMTP salvos.

### `GET /api/admin/users`
Lista todos os usuários cadastrados no sistema.

### `POST /api/setup/import`
Importa transações em lote via arquivo enviado pelo administrador.
