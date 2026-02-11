# 🔧 Como Habilitar Compartilhamento Público de Veículos

## 🚨 Problema

Ao compartilhar um link de veículo, a página fica mostrando:
> "Veículo não encontrado. Este link pode estar desatualizado ou o veículo foi removido."

## 🔍 Causa

O **Row Level Security (RLS)** do Supabase está bloqueando o acesso público aos veículos. Por padrão, apenas usuários autenticados da mesma loja podem visualizar os dados.

## ✅ Solução

Execute o script SQL no **Supabase SQL Editor** para permitir leitura pública:

### Passo 1️⃣: Acessar o Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto **Velohub**
3. No menu lateral, clique em **SQL Editor**

### Passo 2️⃣: Executar o Script

1. Clique em **+ New Query**
2. Copie todo o conteúdo de `supabase/enable-public-vehicle-sharing.sql`
3. Cole no editor SQL
4. Clique em **RUN** (ou pressione `Ctrl + Enter`)

### Passo 3️⃣: Verificar

Você verá a mensagem:
```
Success. No rows returned
```

✅ Pronto! Agora os links de compartilhamento funcionam!

---

## 📋 O que o script faz?

### ✅ Permite (LEITURA PÚBLICA):
- ✓ Qualquer pessoa pode **visualizar** veículos compartilhados
- ✓ Qualquer pessoa pode **visualizar** nome das lojas
- ✓ **Sem necessidade de login** para acessar links compartilhados

### 🔒 Mantém Seguro (AUTENTICAÇÃO NECESSÁRIA):
- ✓ Apenas membros da loja podem **CRIAR** veículos
- ✓ Apenas membros da loja podem **EDITAR** veículos
- ✓ Apenas membros da loja podem **EXCLUIR** veículos

---

## 📱 Como Adicionar WhatsApp na Loja

Quando você clica em "Tenho Interesse" no link compartilhado, o visitante é redirecionado para WhatsApp. Para isso funcionar, você precisa:

### Passo 1️⃣: Executar Script SQL

⚠️ **PRIMEIRO**, execute este script caso ainda não tenha feito:

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto **Velohub**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **+ New Query**
5. Copie todo o conteúdo de `supabase/add-whatsapp-field.sql`
6. Cole no editor SQL
7. Clique em **RUN** (ou pressione `Ctrl + Enter`)

Você verá a mensagem:
```
Success. No rows returned
```

### Passo 2️⃣: Adicionar WhatsApp no Perfil

1. Faça login no Velohub
2. Clique em **Configurações** (no menu)
3. Procure por **WhatsApp** na seção "Dados da Organização"
4. Digite seu número (** apenas dígitos, ex: 11999999999**)
5. Clique em **Salvar**

### Passo 3️⃣: Testar

1. Compartilhe um veículo
2. Clique em "Tenho Interesse"
3. Você deve ser redirecionado para WhatsApp com uma mensagem pré-formatada! ✨

---

## 🎯 O que é um Número de WhatsApp Válido?

- ✅ **Formato:** 2 dígitos de DDD + 8 ou 9 dígitos do número
- ✅ **Exemplo:** `11999999999` (São Paulo)
- ✅ **No campo:** Digite **apenas números**, sem parênteses ou hífens
- ✅ **O sistema adiciona automaticamente o +55** (país Brasil)

### Exemplos por Estado:

| Estado | DDD | Exemplo Completo |
|--------|-----|-----------------|
| São Paulo | 11 | 11999999999 |
| Rio de Janeiro | 21 | 21999999999 |
| Minas Gerais | 31 | 31999999999 |
| Bahia | 71 | 71999999999 |
| Ceará | 85 | 85999999999 |

---

## 🔗 Redirecionamento WhatsApp

Quando alguém clica em "Tenho Interesse", é enviada uma mensagem automática como esta:

```
Olá, vi o anúncio do *Hyundai HB20* na *Minhas Motors* e gostaria de mais informações.
```

---

## ⚠️ Erros Comuns

### "Erro ao atualizar perfil"
- **Motivo:** Coluna `whatsapp` não existe no banco de dados
- **Solução:** Execute o script `add-whatsapp-field.sql` primeiro

### "WhatsApp da loja não configurado"
- **Motivo:** Campo WhatsApp vazio ou em formato inválido
- **Solução:** Adicione um número válido no perfil (ex: 11999999999)

### Botão "Tenho Interesse" não abre WhatsApp
- **Motivo:** Número de WhatsApp em formato incorreto
- **Solução:** Verifique se está digitando **apenas números**

---

## 📚 Documentação Supabase

- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Policies](https://supabase.com/docs/guides/database/postgres/row-level-security)
