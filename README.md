
# 🏎️ VELOHUB - Plataforma de Gestão Automotiva

Bem-vindo ao repositório oficial do **Velohub**. Este é um sistema SaaS (Software as a Service) completo para gestão de estoque de veículos, financeiro e contratos para lojas de carros.

---

## 📋 Índice

1.  [Pré-requisitos](#-pré-requisitos)
2.  [Instalação Local](#-instalação-local)
3.  [Configuração do Banco de Dados (Supabase)](#-configuração-do-banco-de-dados-supabase)
4.  [📧 CONFIGURAÇÃO DE EMAIL (OBRIGATÓRIO)](#-configuração-de-email-obrigatório)
5.  [🚀 GUIA DE PRODUÇÃO & WEBHOOKS](#-guia-de-produção--webhooks-obrigatório)
6.  [Deploy na Vercel](#-deploy-na-vercel)

---

## 🎒 Pré-requisitos

*   **Node.js** (v18+)
*   **Git**
*   **VS Code**

---

## 👣 Instalação Local

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/SEU_USUARIO/velohub.git
    cd velohub
    ```

2.  **Instale**:
    ```bash
    npm install
    ```

3.  **Configuração `.env`**:
    Crie um arquivo `.env` na raiz:
    ```env
    VITE_SUPABASE_URL=sua_url_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon
    VITE_STRIPE_PUBLIC_KEY=sua_chave_publica_stripe
    ```

4.  **Rodar**: `npm run dev`

---

## 🧠 Configuração do Banco de Dados (Supabase)

1.  Crie um projeto em [supabase.com](https://supabase.com).
2.  No **SQL Editor**, rode o script abaixo para criar as tabelas e triggers:

```sql
-- TABELAS E SEGURANÇA
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text default 'owner',
  store_id text not null,
  store_name text,
  cnpj text,
  phone text,
  city text,
  state text,
  cep text,
  plan text default 'free',
  stripe_customer_id text,
  subscription_status text,
  trial_ends_at timestamp with time zone,
  contract_template text,
  permissions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  store_id text not null,
  make text,
  model text,
  version text,
  year integer,
  plate text,
  km integer,
  fuel text,
  transmission text,
  color text,
  status text default 'available',
  purchase_price numeric default 0,
  purchase_date timestamp with time zone,
  expected_sale_price numeric default 0,
  fipe_price numeric default 0,
  sold_price numeric,
  sold_date timestamp with time zone,
  payment_method text,
  sale_commission numeric,
  sale_commission_to text,
  buyer jsonb,
  trade_in_info jsonb,
  reservation_details jsonb,
  warranty_details jsonb,
  ipva_paid boolean default false,
  licensing_paid boolean default false,
  photos text[],
  expenses jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.store_expenses (
  id uuid default gen_random_uuid() primary key,
  store_id text not null,
  description text,
  amount numeric,
  category text,
  date timestamp with time zone,
  paid boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (POLÍTICAS DE SEGURANÇA)
alter table users enable row level security;
alter table vehicles enable row level security;
alter table store_expenses enable row level security;

create or replace function get_my_store_id()
returns text as $$
  select store_id from users where id = auth.uid();
$$ language sql stable security definer;

create policy "Ver proprio perfil" on users for select using (auth.uid() = id);
create policy "Ver time" on users for select using (store_id = get_my_store_id());
create policy "Editar proprio perfil" on users for update using (auth.uid() = id);
create policy "Ver veiculos da loja" on vehicles for all using (store_id = get_my_store_id());
create policy "Ver despesas da loja" on store_expenses for all using (store_id = get_my_store_id());

-- STORAGE
insert into storage.buckets (id, name, public) values ('vehicles', 'vehicles', true);
create policy "Imagens Publicas" on storage.objects for select using ( bucket_id = 'vehicles' );
create policy "Upload Permitido" on storage.objects for insert with check ( bucket_id = 'vehicles' and auth.role() = 'authenticated' );

-- TRIGGER DE CRIAÇÃO DE USUÁRIO
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, store_id, store_name, role, plan, cnpj, phone, city, state)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    coalesce(new.raw_user_meta_data->>'store_id', gen_random_uuid()::text),
    new.raw_user_meta_data->>'store_name',
    coalesce(new.raw_user_meta_data->>'role', 'owner'),
    coalesce(new.raw_user_meta_data->>'plan', 'free'),
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 📧 CONFIGURAÇÃO DE EMAIL (OBRIGATÓRIO)

O Supabase **não consegue enviar emails** sem uma configuração de provedor externo. Sem isso:
- ❌ Link de confirmação NÃO chega
- ❌ Recuperação de senha NÃO funciona
- ❌ Convites de equipe NÃO são enviados

### 🚀 Dois Caminhos:

#### **OPÇÃO 1: Rápido (Desenvolvimento)**
Se você quer testar rápido **sem configurar email ainda**:
1. Desabilite verificação de email no Supabase (veja `docs/QUICK_EMAIL_FIX.md`)
2. Usuários se registram imediatamente sem validação
3. **Lembre-se**: Isso é só para DEV, produção precisa de email real!

#### **OPÇÃO 2: Completo (Produção)**
Configure o **Resend** (gratuito até 3000 emails/mês):

1.  Crie uma conta em [Resend.com](https://resend.com)
2.  Gere uma **API Key** no Resend
3.  Vá no Supabase Dashboard > **Authentication** → **Email Provider** (ou **Settings**)
4.  Selecione **Resend** como provider
5.  Cole a **API Key** e clique em **Save**
6.  Use `onboarding@resend.dev` como **Sender Email** (teste; para produção, valide seu domínio)
7.  Pronto! Seus emails chegarão instantaneamente

**🔗 Documentação Completa:**
- **Guia rápido para dev**: [`docs/QUICK_EMAIL_FIX.md`](./docs/QUICK_EMAIL_FIX.md)
- **Guia completo**: [`docs/SETUP_EMAIL_CONFIGURATION.md`](./docs/SETUP_EMAIL_CONFIGURATION.md) (incluindo SendGrid e troubleshooting)

---

## 🚀 GUIA DE PRODUÇÃO & WEBHOOKS (OBRIGATÓRIO)

Para que o sistema detecte que o usuário pagou e atualize o plano automaticamente, você precisa configurar os **Webhooks do Stripe** conectando com as **Edge Functions do Supabase**.

### 1. Login no Supabase via CLI
No seu terminal, use `npx` (não precisa instalar nada globalmente):
```bash
npx supabase login
```
*Isso abrirá o navegador. Aceite a conexão.*

### 2. Conectar ao Projeto
```bash
npx supabase link --project-ref seu-id-do-projeto
# O ID do projeto está na URL do seu painel Supabase (ex: https://[abcdefgh].supabase.co)
# Digite a senha do banco de dados quando solicitado.
```

### 3. Fazer Deploy da Função Stripe
Esta função receberá os avisos de pagamento.
```bash
npx supabase functions deploy stripe-webhook
```
*Anote a URL gerada no final (ex: `https://[id].supabase.co/functions/v1/stripe-webhook`).*

### 4. Configurar o Webhook no Stripe
1.  Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/test/webhooks) (Developers > Webhooks).
2.  Clique em **Add Endpoint**.
3.  **Endpoint URL**: Cole a URL que você gerou no passo 3.
4.  **Events to send**: Selecione estes dois eventos:
    *   `checkout.session.completed`
    *   `customer.subscription.updated`
5.  Clique em **Add Endpoint**.
6.  Na tela seguinte, copie o **Signing secret** (começa com `whsec_...`).

### 5. Configurar Segredos no Supabase
O código precisa das chaves para funcionar.
Vá no Painel do Supabase > **Settings > Edge Functions** e adicione:

*   `STRIPE_API_KEY`: Sua chave secreta do Stripe (`sk_live_...` ou `sk_test_...`).
*   `STRIPE_WEBHOOK_SIGNATURE`: O segredo `whsec_...` que você copiou no passo 4.
*   `SUPABASE_URL`: A URL do seu projeto.
*   `SUPABASE_SERVICE_ROLE_KEY`: A chave secreta do banco (Settings > API > service_role). **Cuidado: Não use a anon key aqui.**
*   `RESEND_API_KEY`: Sua chave do Resend (para envio de convites de equipe).

### 6. Mapear os Planos
Abra o arquivo `supabase/functions/stripe-webhook/index.ts` e edite a constante `PLAN_MAP`. Você deve colocar os IDs de Preço (Price IDs) que você criou no Stripe.
*   Ex: `'price_1Pxyz...': 'starter'`
*   Depois de editar, rode `npx supabase functions deploy stripe-webhook` novamente.

---

## 🌍 Deploy na Vercel

1.  Crie um novo projeto na Vercel e importe este repositório.
2.  Em **Environment Variables**, adicione:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_STRIPE_PUBLIC_KEY`
3.  Faça o deploy.
4.  No Supabase (Authentication > URL Configuration), adicione a URL da Vercel em **Site URL** e **Redirect URLs**.

**Pronto!** Agora, quando um usuário pagar, o Stripe avisará o Supabase, que atualizará o banco de dados, e o Frontend (via Polling) atualizará a tela do usuário em tempo real.

---

## 🔧 Troubleshooting

### ❌ "Erro ao enviar email de confirmação"
**Causa**: Supabase não tem provedor de email configurado
- ✅ Siga `docs/SETUP_EMAIL_CONFIGURATION.md` e configure Resend
- 🚀 Ou desabilite verificação de email (`docs/QUICK_EMAIL_FIX.md`) para desarrollo

### ❌ "Usuário se registra mas não recebe email"
**Verificação**:
1. Seu Resend tem **API Key válida**?
2. A chave está configurada no Supabase (Authentication → Email Provider)?
3. O **Sender Email** está correto (`onboarding@resend.dev` para testes)?
4. Você criou a sua conta no Resend e **confirmou seu email**?

### ❌ "Erro 17MB ou build muito grande"
**Solução**: Rode `npm run build` localmente e verifique se há módulos desnecessários
- Verifique `vite.config.ts` para exclusões
- Limpe `node_modules` e reinstale: `rm -r node_modules && npm install`

### ✅ "Agora funciona! Como faço para ir para produção?"
1. Configure seu **domínio próprio** no Resend (ex: `noreply@velohub.com`)
2. **Re-habilite** email verification no Supabase
3. Configure todos os **webhooks do Stripe** (veja seção acima)
4. **Teste tudo** antes de publicar!

Para mais detalhes, veja a documentação completa em `docs/`
