# Crime Game — Alterações

## Bug Fixes

### Logout no refresh
- `auth.store.ts` — `isLoading` começa como `true` (evita flash de redirect)
- `Providers.tsx` — `AuthHydrator` bloqueia renderização até `hydrateFromServer()` resolver
- `dashboard/layout.tsx` — guard `!isLoading && !isAuthenticated` (nunca redireciona durante hidratação)
- `QueryClient` movido para fora do componente (singleton) — cache não é perdido

### Navegação lenta
- `QueryClient` como singleton com `staleTime: 60s` e `gcTime: 5min`
- `refetchOnWindowFocus: false` e `refetchOnReconnect: false`

---

## Novas Regras de Negócio

### Acesso a casos (CaseAccess)
- Novo modelo `CaseAccess` no schema Prisma (`case_access` table)
- **Migração necessária:** `npx prisma migrate dev --name add_case_access`
- Serviço `case-access.service.ts`: `hasAccess`, `grantAccessFromOrder`, `getUserCases`, `adminGrantAccess`
- Endpoints: `GET /cases/my-access`, `GET /cases/:slug/access`, `POST /cases/:caseId/grant-access`

### Sessões — casos pagos exigem compra
- `session.service.ts` — `createSession` verifica `CaseAccess` se `priceDigital > 0`
- Admin tem acesso sempre (bypass)
- Erro `CASE_ACCESS_REQUIRED` → HTTP 403 com mensagem clara
- Frontend `sessions/new` — casos bloqueados mostrados com badge "Comprar" e link direto

### Compra única por caso
- `order.service.ts` — `createOrder` verifica `CaseAccess` antes de criar
- Erro `ALREADY_PURCHASED:<título>` → HTTP 409 com mensagem específica
- Frontend recebe a mensagem do backend via toast

### Player → Organizer após compra
- `order.service.ts` — `promoteToOrganizer()` promove apenas `player` (admin/organizer inalterados)
- Chamado após Stripe `payment_intent.succeeded` e PayPal capture/webhook
- `checkout/success` — refetch do user + invalida queries de acesso
- Sidebar mostra "Case Builder" imediatamente após promoção

---

## Novas Páginas / Componentes

| Ficheiro | Descrição |
|---|---|
| `dashboard/my-cases/page.tsx` | Biblioteca de casos comprados |
| `dashboard/cases/[slug]/page.tsx` | Detalhe do caso com verificação de acesso |
| `dashboard/sessions/new/page.tsx` | Nova sessão com seletor de casos acessíveis |
| `checkout/[orderId]/page.tsx` | Checkout com Stripe Elements embedded |
| `checkout/success/page.tsx` | Página de retorno Stripe com refetch do user |
| `admin/cases/new/page.tsx` | Criar caso (admin) |
| `admin/cases/[id]/edit/page.tsx` | Editar caso (admin) |
| `components/admin/CaseForm.tsx` | Formulário reutilizável de caso |

---

## Variáveis de Ambiente Necessárias

```env
# Backend
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Stripe Sandbox — Cartão de Teste
```
Número: 4242 4242 4242 4242
Validade: qualquer data futura
CVC: qualquer 3 dígitos
```

---

## Sessão Atual — Continuação

### Correções nos hooks (useAuth.ts)
- `useVerifyEmail` — removido redirect e toast automáticos (conflito com estados inline da página)
- `useResetPassword` — removido toast e redirect (página trata tudo)
- `useRegister` — removido redirect para `/verify-email-sent` (página mostra estado de sucesso inline)
- `useResendVerification` — toast removido (tratado inline em `verify-email-sent`)
- `useForgotPassword` — corrigido para passar `{ email }` como objeto

### Página verify-email-sent melhorada
- Feedback de sucesso/erro no reenvio inline (não toast)
- Instrução clara de verificar pasta de spam
- Enter no campo de email dispara reenvio
- Estado de sucesso após reenvio bem-sucedido

### Error middleware
- Só loga erros inesperados (não operacionais) — reduz ruído no console
