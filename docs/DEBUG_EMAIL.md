# 🔍 Debug: Email Não Chegando

## 🚨 Problema: Email do Resend Não Chega

Você configurou o Resend no Supabase, mas **não está recebendo os emails de confirmação**.

---

## ✅ Passo 1: Verificar no Dashboard do Resend

1. Acesse https://resend.com/emails
2. Procure por um email enviado para você
3. **Qual é o status?**
   - ✅ **Delivered** → Email foi entregue (procure na sua caixa de spam)
   - ❌ **Failed** → Erro no envio (veja a mensagem de erro)
   - ❌ **Bounced** → Seu email foi rejeitado
   - ❌ **Nada aparece** → Supabase não conseguiu conectar no Resend

---

## ✅ Passo 2: Verificar a Configuração do Supabase

1. Vá para https://supabase.com/dashboard
2. Clique no seu projeto **Velohub**
3. Menu lateral → **Authentication**
4. Procure por **"Email Provider"** ou **"Settings"**
5. Verifique:
   - Está **Resend** selecionado?
   - A **API Key** está preenchida? (deve começar com `re_`)
   - Clique em **Save** (mesmo que pareça estar ok)

---

## ✅ Passo 3: Verificar se é Problema de Domínio

**Resend tem limitação em teste**: você só pode enviar para o **email com o qual criou a conta**.

1. Qual email você usou para **criar a conta no Resend**?
2. Tente se registrar com **exatamente esse email** no Velohub
3. Se funcionar → Esse é o problema
4. **Solução**: Adicione um domínio verificado no Resend para enviar para qualquer email

---

## ✅ Passo 4: Testar se Funciona

1. Vá para [velohub-theta.vercel.app](https://velohub-theta.vercel.app/)
2. Clique em **Registrar**
3. **No email**: Digite o email com o qual criou conta no Resend (se Passo 3 confirmou)
4. Complete o registro
5. **Verifique sua caixa de email** (inbox + spam + promotions)
6. Se chegou → Email funciona! ✅

---

## 🔧 Se Ainda Não Funcionar

### Opção A: Verificar Logs do Supabase
1. Vá para **Logs** → **Auth** no Supabase
2. Procure por algo como:
```json
{
  "path": "/resend",
  "status": 200,
  "method": "POST"
}
```
- ✅ **Status 200** → Resend recebeu (veja no Resend dashboard por quê não entregou)
- ❌ **Status 401/403** → API Key inválida ou expirada
- ❌ **Status 500** → Erro no Resend

### Opção B: Testar Email Direto do Resend
1. Acesse https://resend.com/docs/api-reference/emails/send
2. Copie o exemplo de código
3. Insira sua **API Key** e seu **email**
4. Execute
5. Se chegar → Resend funciona, problema é na integração Supabase

### Opção C: Usar Temporariamente Sem Email
Se não conseguir resolver rápido:
1. No Supabase Dashboard
2. **Authentication** → **Settings**
3. Desmarque **"Require email verification"**
4. Clique **Save**
5. Agora é possível se registrar sem validar email (só para dev!)

---

## 📋 Checklist

- [ ] Resend API Key está correta (começa com `re_`)?
- [ ] API Key está configurada no Supabase?
- [ ] Testou com o email que criou a conta no Resend?
- [ ] Checou inbox + spam + promotions?
- [ ] Verificou o dashboard do Resend para ver status do email?
- [ ] Clicou em Save no Supabase (mesmo que pareça estar ok)?

Se nenhum desses passos funcionar, há 3 possibilidades:
1. **API Key inválida** → Copie novamente do Resend
2. **Domínio bloqueado** → Use um domínio verificado no Resend
3. **Bug no Supabase** → Tente usando SendGrid em vez de Resend

