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
Autenticação manual do usuário.
- **Corpo**: `{ "email": "string", "password": "string" }`
- **Resposta**: Retorna um **Token JWT** e os dados do usuário. Ideal para integrações externas.

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
- **Corpo**: `{ "descricao": "string", "valor": number, "data": "date string", "categoria": "string", "tipoMovimentacao": "string" }`

### `PUT /api/receitas` | `PUT /api/despesas`
Atualiza uma transação existente.
- **Corpo**: `{ "id": "string", "descricao": "string", "valor": number, ... }`

### `DELETE /api/receitas` | `DELETE /api/despesas`
Remove uma transação.
- **Query Params**: `id=ID_DA_TRANSACAO`

---

## 📊 Dashboard e Relatórios

### `GET /api/dashboard/stats`
Retorna estatísticas consolidadas para o dashboard inicial.
- **Dados**: Saldo atual, receitas/despesas do mês, dados para o gráfico de 6 meses e últimas 5 transações.

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
