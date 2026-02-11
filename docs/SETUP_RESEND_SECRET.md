# ⚙️ Configurar RESEND_API_KEY no Supabase

## 🚨 Problema

A função de suporte (`send-support`) está dando erro porque não tem acesso à chave do Resend.

---

## ✅ Solução: Adicionar Secret no Supabase

### Passo 1: Copiar sua RESEND_API_KEY

1. Acesse https://resend.com/dashboard
2. Vá para **API Keys**
3. Copie sua chave (começa com `re_`)

### Passo 2: Adicionar no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique no seu projeto **Velohub**
3. Menu lateral → **Settings** → **Edge Functions**
4. Em **Secrets**, clique em **+ New Secret**
5. **Name**: `RESEND_API_KEY`
6. **Value**: Cole sua chave do Resend (ex: `re_ABC123...`)
7. Clique em **Save**

### Passo 3: Deploy da Função

1. No seu terminal, rode:
```bash
npx supabase functions deploy send-support
```

2. Se pedir credenciais, rode primeiro:
```bash
npx supabase login
```

3. Depois conecte ao projeto:
```bash
npx supabase link --project-ref seu-id-projeto
```

### Passo 4: Testar

1. Vá para sua landing page (LegalPages) → Central de Ajuda
2. Preencha o formulário de suporte
3. Envie uma mensagem
4. Deve chegar sem erro! ✅

---

## 🔍 Se Ainda Der Erro

### Verifique nos Logs

1. No Supabase, vá para **Logs** (menu lateral inferior)
2. Procure por **Edge Functions**
3. Clique em **send-support**
4. Veja qual é o erro exato

### Checklist

- [ ] RESEND_API_KEY está configurada no Supabase?
- [ ] A chave começa com `re_`?
- [ ] Você fez deploy da função (`npx supabase functions deploy send-support`)?
- [ ] Aguardou alguns segundos após o deploy?
- [ ] O email `suporte@velohub.com` está correto no código?

---

## 📝 Código da Função

A função `send-support` faz:
1. ✉️ Envia email **para você** (`suporte@velohub.com`) com a mensagem do usuário
2. ✉️ Envia confirmação automática **para o usuário** avisando que foi recebido

O email de origem é `onboarding@resend.dev` (padrão do Resend em teste).

---

## 💡 Alternativa: Testar Localmente

Se estiver desenvolvendo localmente, pode não ativar o envio:

```typescript
// No seu código, pode fazer:
if (process.env.SEND_EMAILS !== 'false') {
  // Enviar email via Resend
}
```

Assim durante dev você coloca `SEND_EMAILS=false` no `.env` e não precisa da chave.
