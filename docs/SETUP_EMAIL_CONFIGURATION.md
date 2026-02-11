# 📧 Configurar Emails no Supabase

Se você não está recebendo o email de confirmação da conta, siga estes passos.

## 🚨 Problema Comum

O Supabase precisa de configuração de email para enviar:
- ✅ Link de confirmação de conta (signup)
- ✅ Link de recuperação de senha (reset password)
- ✅ Convites da equipe

## ✅ Solução

### Opção 1: Usar Resend (Recomendado - Gratuito)

#### Passo 1: Criar conta no Resend

1. Acesse https://resend.com
2. Clique em **"Sign Up"**
3. Cadastre-se com seu email
4. Copie a **API Key** (você verá na dashboard)

#### Passo 2: Configurar no Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto **Velohub**
3. Vá para **Authentication** → **Email Templates** (no menu lateral esquerdo)
4. Clique na aba **Settings** (ou em **Email Provider**)
5. Escolha **Resend** como provider
6. Cole sua **API Key do Resend**
7. Clique em **Save**

#### Passo 3: Validar Domínio (Produção)

Para enviar de um domínio customizado (ex: `noreply@velohub.com`):

1. No Resend, vá para **Domains**
2. Clique em **+ Add Domain**
3. Digite seu domínio (ex: `velohub.com`)
4. Siga as instruções para adicionar records DNS
5. Após validado, use `noreply@velohub.com` no Supabase

**Até validar o domínio**, você pode usar:
```
Velohub <onboarding@resend.dev>  (ТОЛЬКО para testes)
```

---

### Opção 2: Usar SendGrid

1. Crie conta em https://sendgrid.com
2. Gere uma **API Key**
3. No Supabase, escolha **SendGrid** como provider
4. Cole a API Key
5. Salve

---

## 🧪 Teste de Envio

Após configurar, teste assim:

1. **Abra uma janela anônima** (Ctrl + Shift + N no Chrome)
2. Acesse seu Velohub
3. Clique em **"Criar Conta"**
4. Preencha com um email diferente (não use admin@)
5. Clique em **"Começar Teste Grátis"**
6. Verifique:
   - ✅ Caixa de entrada
   - ✅ Pasta de **Spam/Lixo**
   - ✅ Promotions (se Gmail)

---

## 🔍 Diagnóstico

### Se ainda não receber:

1. **Verificar logs no Supabase:**
   - Vá para **Authentication** → **Users**
   - Clique no usuário criado
   - Procure por alertas de envio de email

2. **Verificar configuração do Resend:**
   - Acesse https://resend.com/emails
   - Procure pelo email enviado
   - Veja o status (sent, failed, bounced, etc)

3. **Checklist:**
   - ✅ Resend API Key está correta?
   - ✅ Supabase está usando Resend como provider?
   - ✅ Email está correto (sem typos)?
   - ✅ Checou pasta de spam?
   - ✅ Se usando `@resend.dev`, o email está cadastrado no Resend?

---

## 📝 Modo Teste (Desenvolvimento)

Se estiver desenvolvendo **localmente** e quer evitar configurar email:

1. No Supabase, desative a confirmação de email:
   - Vá para **Authentication** → **Settings**
   - Procure por **Require email verification**
   - Desmarque ☐
   - Clique em **Save**

⚠️ **IMPORTANTE**: Re-enable em produção!

---

## 🐛 Problemas Comuns

### "RESEND_API_KEY not configured"
- Seu Supabase não tem a chave do Resend configurada
- Siga o **Passo 2** acima

### "Test domain restriction"
- Você criou a conta Resend mas não enviou para um email vinculado
- No Resend, adicione seu email como **authorized recipient**
- Ou use um email já cadastrado no Resend

### Email chegando de "noreply@resend.dev"
- Você está em modo teste
- Para produção, adicione um domínio verificado no Resend

### Email chegando com atraso
- Resend leva 30 segundos a 1 minuto
- Espere um pouco antes de tentar novamente

---

## 📧 Templates de Email

Os templates padrão do Supabase são básicos. Para customizar:

1. No Supabase, vá para **Authentication** → **Email Templates**
2. Clique em cada email (Confirmation, Reset Password, etc)
3. Customize o HTML conforme desejar
4. Use variáveis como `{{ .ConfirmationURL }}`, `{{ .Email }}`, etc

---

## 🚀 Próximas Ações

Após configurar emails:

1. ✅ Teste criar uma conta nova
2. ✅ Confirme o email clicando no link
3. ✅ Login com a nova conta
4. ✅ Teste "Esqueci minha senha"
5. ✅ Teste convitar um funcionário

---

## 💡 Dicas

- Use **[temp-mail.org](https://temp-mail.org)** para testes rápidos
- Sempre checue **spam/promotions** antes de reportar bug
- Logs do Resend mostram exatamente o que aconteceu com cada email
