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

## 🧪 Como Testar

1. **Compartilhe um veículo** no Velohub
2. **Copie o link** gerado
3. **Abra em janela anônima** (Ctrl + Shift + N no Chrome)
4. A ficha do veículo deve carregar normalmente! ✨

---

## 🛡️ Segurança

Não se preocupe! Esta configuração é **segura** porque:

- ✅ Apenas **dados básicos** dos veículos são públicos (marca, modelo, ano, fotos, preço)
- ✅ **Informações sensíveis** como preço de compra, gastos e lucro permanecem **privados**
- ✅ Apenas **usuários autenticados** podem modificar dados
- ✅ **Row Level Security** continua ativo para INSERT/UPDATE/DELETE

---

## 🐛 Problemas?

Se ainda não funcionar após executar o script:

1. **Verifique os logs do navegador** (F12 → Console)
2. **Procure por mensagens** começando com 🔍, ✅ ou ❌
3. **Copie as mensagens de erro** e reporte ao suporte

---

## 📚 Documentação Supabase

- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Policies](https://supabase.com/docs/guides/database/postgres/row-level-security)
