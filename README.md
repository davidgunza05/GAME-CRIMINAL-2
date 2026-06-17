# 🔍 Crime Game — Plataforma Imersiva de Investigação Criminal

Monorepo com **Next.js** (frontend) + **Node.js/Express** (backend) + **PostgreSQL** + **Redis**.

---

## 📁 Estrutura do Projeto

```
crime-game/
├── backend/                   # API Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma      # Schema da base de dados
│   └── src/
│       ├── config/            # Env, Prisma client
│       ├── controllers/       # Handlers HTTP
│       ├── middleware/        # Auth, validação, erros
│       ├── models/            # Schemas Zod
│       ├── routes/            # Rotas Express
│       ├── services/          # Lógica de negócio
│       ├── utils/             # JWT, crypto, response
│       ├── app.ts             # Express app
│       └── index.ts           # Entry point
│
├── frontend/                  # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── auth/          # Login, registo, verify, reset
│       │   └── dashboard/     # Dashboard + settings + admin
│       ├── components/
│       │   ├── layout/        # Providers
│       │   └── ui/            # FormField
│       ├── hooks/             # useAuth (React Query)
│       ├── lib/               # Axios client
│       ├── store/             # Zustand (auth store)
│       └── types/
│
└── package.json               # Workspace root
```

---

## ⚙️ Pré-requisitos

- **Node.js** 20+
- **PostgreSQL** 15+
- **Redis** 7+
- **npm** 10+

---

## 🚀 Setup — Passo a Passo

### 1. Clonar e instalar dependências

```bash
git clone <repo-url> crime-game
cd crime-game
npm install
```

### 2. Configurar variáveis de ambiente

**Backend:**
```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` com os teus valores:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/crime_game?schema=public"
REDIS_URL=redis://localhost:6379

JWT_SECRET=muda-isto-para-uma-string-longa-e-segura-minimo-32-chars
JWT_REFRESH_SECRET=outra-string-longa-e-segura-para-refresh-tokens

RESEND_API_KEY=re_xxxx          # Obtém em resend.com (grátis)
EMAIL_FROM=noreply@tuaapp.com
FRONTEND_URL=http://localhost:3000
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env.local
```

### 3. Criar a base de dados

```bash
# Cria a DB no PostgreSQL
psql -U postgres -c "CREATE DATABASE crime_game;"

# Executa as migrations
npm run db:migrate

# Gera o cliente Prisma
npm run db:generate

# (Opcional) Seed com utilizadores de demo
npm run db:seed
```

### 4. Iniciar o projeto

```bash
# Inicia backend + frontend em simultâneo
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api
- **Health check:** http://localhost:4000/api/health

---

## 🗄️ Base de Dados

Explorar a DB visualmente:
```bash
npm run db:studio
```

Abrir em: http://localhost:5555

---

## 👤 Utilizadores de Demo (após seed)

| Role       | Email                      | Password          |
|------------|----------------------------|-------------------|
| Admin      | admin@crimegame.com        | Admin@123456      |
| Organizer  | organizer@crimegame.com    | Organizer@123456  |
| Player     | player@crimegame.com       | Player@123456     |

---

## 🔐 API — Endpoints de Auth

| Método | Endpoint                        | Descrição                  | Auth |
|--------|---------------------------------|----------------------------|------|
| POST   | `/api/auth/register`            | Criar conta                | ❌   |
| POST   | `/api/auth/login`               | Login                      | ❌   |
| POST   | `/api/auth/refresh`             | Renovar access token       | 🍪   |
| POST   | `/api/auth/logout`              | Logout                     | ❌   |
| POST   | `/api/auth/logout-all`          | Logout em todos dispositivos | ✅  |
| POST   | `/api/auth/verify-email`        | Verificar email            | ❌   |
| POST   | `/api/auth/resend-verification` | Reenviar verificação       | ❌   |
| POST   | `/api/auth/forgot-password`     | Recuperar password         | ❌   |
| POST   | `/api/auth/reset-password`      | Redefinir password         | ❌   |
| GET    | `/api/auth/me`                  | Utilizador atual           | ✅   |

## 👥 API — Endpoints de Utilizadores

| Método | Endpoint                    | Descrição              | Auth    |
|--------|-----------------------------|------------------------|---------|
| GET    | `/api/users/me`             | O meu perfil           | ✅      |
| PATCH  | `/api/users/me`             | Atualizar perfil       | ✅      |
| PATCH  | `/api/users/me/password`    | Alterar password       | ✅      |
| PATCH  | `/api/users/me/username`    | Alterar username       | ✅      |
| GET    | `/api/users/:username/profile` | Perfil público      | ❌      |
| GET    | `/api/users`                | Listar utilizadores    | 🛡 Admin |
| GET    | `/api/users/:id`            | Ver utilizador         | 🛡 Admin |
| PATCH  | `/api/users/:id/active`     | Ativar/desativar       | 🛡 Admin |
| PATCH  | `/api/users/:id/role`       | Alterar role           | 🛡 Admin |

---

## 🔒 Segurança

- **JWT** com access token de curta duração (15min)
- **Refresh tokens** com rotação automática e deteção de reutilização
- **bcrypt** com salt rounds 12
- **httpOnly cookies** para refresh tokens
- **Rate limiting** em endpoints sensíveis
- **Helmet** para headers de segurança
- **CORS** configurado por origem
- **Zod** para validação de todos os inputs

---

## 📧 Emails

Em `development` sem `RESEND_API_KEY`, os emails são apenas logados na consola.

Para produção, cria uma conta gratuita em [resend.com](https://resend.com).

---

## 🗺️ Roadmap

- ✅ **Fase 1** — Autenticação & Utilizadores
- 🔲 **Fase 2** — E-commerce & Casos
- 🔲 **Fase 3** — Motor de Jogo & Sessões
- 🔲 **Fase 4** — Frontend de Jogo
- 🔲 **Fase 5** — Pontuação & Comunicações
- 🔲 **Fase 6** — Admin Dashboard & Analytics
- 🔲 **Fase 7** — Marketplace de Criadores
