
# 🏎️ VELOHUB - Plataforma de Gestão Automotiva

Bem-vindo ao repositório oficial do **Velohub**. Este é um sistema SaaS (Software as a Service) completo para gestão de estoque de veículos, financeiro e contratos para lojas de carros.

---

## 📋 Índice

1.  [Pré-requisitos](#-pré-requisitos)
2.  [Instalação Local](#-instalação-local)
3.  [Configuração do Banco de Dados (Supabase)](#-configuração-do-banco-de-dados-supabase)
4.  [Configuração de Pagamentos (Stripe)](#-configuração-de-pagamentos-stripe)
5.  [Configuração de Emails (Resend)](#-configuração-de-emails-resend)
6.  [🚀 DEPLOY (Colocar no Ar)](#-deploy-colocando-no-ar)
7.  [Ajustes Finais (Pós-Deploy)](#-ajustes-finais-pós-deploy)

---

## 🎒 Pré-requisitos

Para rodar este projeto, você precisa ter instalado:

*   **Node.js** (Versão 18 ou superior) - [Baixar](https://nodejs.org/)
*   **Git** - [Baixar](https://git-scm.com/)
*   **VS Code** - Editor de código recomendado.

---

## 👣 Instalação Local

1.  **Clone o repositório** (ou baixe os arquivos):
    ```bash
    git clone https://github.com/SEU_USUARIO/velohub.git
    cd velohub
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Crie o arquivo de variáveis de ambiente**:
    Crie um arquivo chamado `.env` na raiz do projeto e cole o seguinte (preencheremos os valores nos próximos passos):

    ```env
    # Supabase (Project Settings > API)
    VITE_SUPABASE_URL=
    VITE_SUPABASE_ANON_KEY=

    # Stripe (Developers > API Keys)
    VITE_STRIPE_PUBLIC_KEY=
    ```

4.  **Inicie o servidor local**:
    ```bash
    npm run dev
    ```
    O site rodará em `http://localhost:5173`.

---

## 🧠 Configuração do Banco de Dados (Supabase)

O Velohub usa o Supabase para Autenticação, Banco de Dados e Armazenamento de Fotos.

1.  Crie uma conta em [supabase.com](https://supabase.com) e crie um novo projeto.
2.  No painel do projeto, vá em **Project Settings > API**.
    *   Copie a `Project URL` e cole em `VITE_SUPABASE_URL` no seu arquivo `.env`.
    *   Copie a `anon` `public` key e cole em `VITE_SUPABASE_ANON_KEY` no seu arquivo `.env`.
3.  Vá em **SQL Editor**, clique em **New Query**, cole o código abaixo e clique em **RUN**:

```sql
-- TABELA DE USUÁRIOS (LOJAS)
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

-- TABELA DE VEÍCULOS
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
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- TABELA DE DESPESAS DA LOJA (OPEX)
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

-- SEGURANÇA (RLS - Row Level Security)
alter table users enable row level security;
alter table vehicles enable row level security;
alter table store_expenses enable row level security;

-- POLÍTICAS DE ACESSO
-- 1. Usuário sempre vê seu próprio perfil (Evita bloqueio no login)
create policy "Ver proprio perfil" on users for select using (auth.uid() = id);
create policy "Editar proprio perfil" on users for update using (auth.uid() = id);
create policy "Criar proprio perfil" on users for insert with check (auth.uid() = id);

-- 2. Ver dados da equipe (mesma loja)
create policy "Ver time" on users for select using (store_id in (select store_id from users where id = auth.uid()));

-- 3. Ver veículos e despesas da loja
create policy "Ver veiculos da loja" on vehicles for all using (store_id in (select store_id from users where id = auth.uid()));
create policy "Ver despesas da loja" on store_expenses for all using (store_id in (select store_id from users where id = auth.uid()));

-- ARMAZENAMENTO DE FOTOS (STORAGE)
insert into storage.buckets (id, name, public) values ('vehicles', 'vehicles', true);
create policy "Imagens Publicas" on storage.objects for select using ( bucket_id = 'vehicles' );
create policy "Upload Permitido" on storage.objects for insert with check ( bucket_id = 'vehicles' and auth.role() = 'authenticated' );

-- GATILHO AUTOMÁTICO (CRIAÇÃO DE PERFIL)
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

## 🔧 Correção de Erros (Se já criou o banco antes)

Se você já rodou o SQL antigo e está tendo problemas de login, **rode este comando no SQL Editor do Supabase** para corrigir as regras de segurança:

```sql
drop policy if exists "Ver dados da propria loja (Users)" on users;
drop policy if exists "Ver proprio perfil" on users;
drop policy if exists "Ver time" on users;

create policy "Ver proprio perfil" on users for select using (auth.uid() = id);
create policy "Ver time" on users for select using (store_id in (select store_id from users where id = auth.uid()));
create policy "Editar proprio perfil" on users for update using (auth.uid() = id);
create policy "Criar proprio perfil" on users for insert with check (auth.uid() = id);
```

---

## 💳 Configuração de Pagamentos (Stripe)

Necessário para vender os planos Starter e Pro.

1.  Crie uma conta em [stripe.com](https://stripe.com).
2.  Vá em **Developers > API Keys**.
    *   Copie a `Publishable key` (pk_test...) e cole em `VITE_STRIPE_PUBLIC_KEY` no `.env`.
3.  Vá em **Product Catalog** e crie os produtos:
    *   **Velohub Starter** (R$ 39,90/mês). Crie um Link de Pagamento.
    *   **Velohub Pro** (R$ 89,90/mês). Crie um Link de Pagamento.
4.  No VS Code, abra `lib/plans.ts` e cole os Links de Pagamento gerados nas propriedades `stripePaymentLink`.
5.  No painel do Stripe, vá em **Settings > Customer Portal**, ative-o, copie o link e cole no arquivo `services/payment.ts`.

---

## 📧 Configuração de Emails (Resend)

Necessário para enviar convites de equipe e receber mensagens de suporte.

1.  Crie uma conta em [resend.com](https://resend.com).
2.  Crie uma API Key e copie-a.
3.  Vá no Painel do **Supabase > Project Settings > Edge Functions**.
4.  Adicione um novo segredo (Secret):
    *   Nome: `RESEND_API_KEY`
    *   Valor: `re_123...` (sua chave).
5.  Implante as funções (Se estiver usando Supabase CLI) ou copie o conteúdo de `supabase/functions` para criar as funções manualmente se necessário. *Nota: Para simplificar, o frontend já está preparado para chamar estas funções.*

---

## 🚀 DEPLOY (Colocar no Ar)

Para resolver problemas de redirecionamento e tornar o site profissional, vamos publicá-lo na **Vercel**.

1.  **Suba o código no GitHub**:
    ```bash
    git init
    git add .
    git commit -m "Deploy inicial"
    # Crie um repo no GitHub e siga as instruções para dar push
    git remote add origin https://github.com/SEU_USUARIO/velohub.git
    git push -u origin main
    ```

2.  **Crie conta na Vercel**:
    *   Acesse [vercel.com](https://vercel.com) e faça login com o GitHub.

3.  **Importe o Projeto**:
    *   Clique em **Add New > Project**.
    *   Selecione o repositório `velohub`.

4.  **Configure as Variáveis (IMPORTANTE!)**:
    *   Na tela de configuração da Vercel, procure a seção **Environment Variables**.
    *   Adicione as mesmas variáveis do seu `.env` local:
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`
        *   `VITE_STRIPE_PUBLIC_KEY`

5.  **Clique em Deploy**:
    *   Aguarde alguns minutos. Quando terminar, você receberá um link (ex: `https://velohub-123.vercel.app`).

---

## 🔧 Ajustes Finais (Pós-Deploy)

Agora que seu site tem um endereço real (`https://...`), você precisa avisar ao Supabase para aceitar logins vindos de lá.

1.  Vá no Painel do Supabase > **Authentication > URL Configuration**.
2.  Em **Site URL**, apague `localhost` e coloque o link da Vercel (ex: `https://velohub-123.vercel.app`).
3.  Em **Redirect URLs**, adicione:
    *   `https://velohub-123.vercel.app/**`
4.  Clique em **Save**.

**Pronto!** Agora o login por email, o reset de senha e os convites funcionarão perfeitamente sem voltar para a Landing Page.
