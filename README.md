# SoftStudy

Aplicacao React + Vite para organizacao de estudo, tarefas e foco.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para correr tambem o backend de email, use outro terminal:

```bash
npm run dev:server
```

## Envio de emails por SMTP Gmail

O envio do codigo de validacao e feito pelo backend Node em `server/index.js`. O frontend chama `VITE_SMTP_EMAIL_API_URL` e o backend envia o email por SMTP, por exemplo com Gmail SMTP e uma App Password.

Nao coloque credenciais SMTP no frontend. Utilizador, palavra-passe, App Password e host SMTP devem ficar apenas no backend.

### Endpoint da API

O backend expoe `POST /api/send-validation-email` e aceita JSON neste formato:

```json
{
  "name": "Nome do utilizador",
  "email": "utilizador@example.com",
  "verificationCode": "123456",
  "loginUrl": "http://localhost:5173"
}
```

Se o email for enviado com sucesso, a API responde com HTTP `2xx`. Se falhar, responde com `4xx` ou `5xx`.

### Configurar o backend

Copie `.env.example` para `.env` e preencha os dados da sua conta:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=o-seu-email@gmail.com
SMTP_PASS=a-sua-app-password
SMTP_FROM_EMAIL=o-seu-email@gmail.com
SMTP_FROM_NAME=SoftStudy
```

### Configurar o frontend

No mesmo ficheiro `.env`, pode configurar a URL usada pelo frontend:

```env
VITE_SMTP_EMAIL_API_URL=http://localhost:3001/api/send-validation-email
```

Se esta variavel nao existir, o frontend usa automaticamente `http://localhost:3001/api/send-validation-email`.

Depois reinicie o frontend com `npm run dev` e o backend com `npm run dev:server`.
