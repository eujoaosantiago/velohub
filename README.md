
# 🏎️ Manual do Pequeno Dono de Loja (Velohub)

Oi! 👋 Bem-vindo ao **Velohub**.

Imagina que você tem uma caixa de LEGO gigante para montar sua própria loja de carros na internet. Esse guia é o manual de instruções para juntar as peças e fazer tudo funcionar!

---

## 🎒 O que você precisa na mochila

Antes de começar, veja se você tem isso instalado no computador (peça ajuda para um adulto se precisar):

1.  **Node.js:** É o motor do nosso carro. [Baixe aqui](https://nodejs.org/).
2.  **VS Code:** É o caderno onde escrevemos os códigos. [Baixe aqui](https://code.visualstudio.com/).
3.  **Git:** É o carteiro que busca os arquivos. [Baixe aqui](https://git-scm.com/).

---

## 👣 Passo 1: Pegando as Peças (Download)

Abra o seu **Terminal** (aquela tela preta de hacker) e digite esses comandos. Aperte `ENTER` depois de cada linha:

1.  **Trazer o código para o seu computador:**
    ```bash
    git clone https://github.com/seu-usuario/velohub.git
    ```

2.  **Entrar na pasta do jogo:**
    ```bash
    cd velohub
    ```

3.  **Instalar os robôs ajudantes:**
    ```bash
    npm install
    ```
    *(Espere as barrinhas carregarem... demora um pouquinho! 🥤)*

---

## 🧠 Passo 2: Criando o Cérebro (Supabase)

O sistema precisa de um lugar para guardar a lista de carros e quem são os donos. Usamos o **Supabase**.

1.  Entre em [supabase.com](https://supabase.com) e crie uma conta (é grátis!).
2.  Crie um "Novo Projeto" e dê um nome (tipo `Minha-Loja-Velohub`). Crie uma senha e guarde ela!
3.  Quando o projeto criar, procure no menu da esquerda um ícone que parece uma folha de papel (**SQL Editor**).
4.  Clique em **New Query** (Nova Consulta).
5.  **Copie e cole** todo o código mágico abaixo na caixa branca e aperte o botão verde **RUN**:

```sql
-- Criando a tabela de Usuários
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

-- Criando a tabela de Carros
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

-- Criando a tabela de Gastos da Loja
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

-- Protegendo os dados (Segurança)
alter table users enable row level security;
alter table vehicles enable row level security;
alter table store_expenses enable row level security;

-- Regras
create policy "Ver dados da propria loja (Vehicles)" on vehicles for all using (store_id in (select store_id from users where id = auth.uid()));
create policy "Ver dados da propria loja (Users)" on users for all using (store_id in (select store_id from users where id = auth.uid()));
create policy "Ver dados da propria loja (Expenses)" on store_expenses for all using (store_id in (select store_id from users where id = auth.uid()));
create policy "Permitir Criar Usuario" on users for insert with check (auth.uid() = id);
create policy "Permitir Update Usuario" on users for update using (auth.uid() = id);

-- Criando o Balde de Fotos
insert into storage.buckets (id, name, public) values ('vehicles', 'vehicles', true);
create policy "Imagens Publicas" on storage.objects for select using ( bucket_id = 'vehicles' );
create policy "Upload Permitido" on storage.objects for insert with check ( bucket_id = 'vehicles' and auth.role() = 'authenticated' );
```

---

## 💳 Passo 3: Criando os Produtos no Stripe (Importante!)

Para vender assinaturas, você precisa criar os "brinquedos" na loja do Stripe.

1.  Entre em [stripe.com](https://stripe.com) e crie sua conta.
2.  No painel, vá em **Catálogo de Produtos** (Product Catalog).
3.  Clique em **Adicionar Produto**.

### 3.1 Criando o Plano "Starter"
1.  **Nome:** Velohub Starter
2.  **Preço:** 39.90 BRL / Mês (Recorrente)
3.  Depois de salvar, procure o botão **Criar Link de Pagamento** (Payment Link).
4.  Crie o link (certifique-se de marcar "Permitir códigos promocionais" e "Coletar endereço do cliente" se quiser).
5.  **Copie o Link** (ex: `https://buy.stripe.com/test_...`) e **Copie o ID do Preço** (ex: `price_1Pxyz...`).
    *   *Dica:* O ID do preço fica na página do produto, parecida com `price_1PoJ...`.

### 3.2 Criando o Plano "Pro"
1.  Repita o processo acima, mas com o nome **Velohub Pro** e preço **89.90**.
2.  Gere o Link de Pagamento.
3.  Guarde o **Link** e o **ID do Preço**.

---

## 🔌 Passo 4: Conectando os Fios (Configuração)

Agora vamos colocar esses links e chaves no código.

### 4.1 Arquivo `.env` (Chaves Secretas)
Crie um arquivo `.env` na pasta do projeto e cole isso:

```env
# Supabase (Project Settings > API)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon

# Stripe (Developers > API Keys)
VITE_STRIPE_PUBLIC_KEY=pk_test_sua_chave_publica
```

### 4.2 Arquivo `lib/plans.ts` (Botões de Compra)
Abra esse arquivo no VS Code e cole os **Links de Pagamento** (aqueles que começam com `https://buy.stripe.com...`) nos lugares indicados:

```typescript
// Dentro de lib/plans.ts
export const PLAN_CONFIG = {
  starter: {
    // ...
    stripePaymentLink: 'COLE_AQUI_SEU_LINK_STARTER' 
  },
  pro: {
    // ...
    stripePaymentLink: 'COLE_AQUI_SEU_LINK_PRO'
  }
}
```

### 4.3 Arquivo `supabase/functions/stripe-webhook/index.ts` (Automação)
Para o sistema liberar o acesso automaticamente quando o cliente pagar, você precisa colocar os **IDs de Preço** (`price_...`) aqui:

```typescript
const PLAN_MAP = {
    'price_SEU_ID_DO_STARTER': 'starter',
    'price_SEU_ID_DO_PRO': 'pro',
}
```

---

## 🎮 Passo 5: Ligar o Motor!

Volte para a tela preta (Terminal) e digite:

```bash
npm run dev
```

Vai aparecer um link mágico (geralmente `http://localhost:5173`). Clique nele.
**Pronto! O site está vivo!** 🎉

---

## 👑 Passo 6: Virando o Chefe Supremo (Plano Enterprise)

Se quiser testar tudo sem pagar:

1.  Vá no site do **Supabase > Table Editor > users**.
2.  Ache seu usuário.
3.  Mude a coluna `plan` de `free` para `enterprise`.
4.  Clique em **Save**.
5.  Dê F5 no site. Agora você é o dono do jogo! 🚀

---

**Divirta-se vendendo muito!** 🏎️💨
