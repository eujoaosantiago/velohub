# 📧 Comparação de Provedores de Email Gratuitos

## 🎯 Resumo Rápido

| Provedor | Limite Gratuito | Supabase | Casos de Uso |
|----------|---|---|---|
| **Resend** | 3.000/mês | ✅ Integrado | Formulários, notificações |
| **Mailgun** | 5.000/mês | ✅ Integrado | Emails de autenticação |
| **SendGrid** | 100/dia (~3.000/mês) | ✅ Integrado | Emails críticos |
| **Brevo** | 300/dia (~9.000/mês) | ✅ Integrado | Melhor para volume BR |
| **AWS SES** | 62.000/mês (sandbox) | ⚠️ Customizado | Máximo volume |

---

## ✅ Recomendação para Seu Case

### Cenário Ideal:
- **Resend** → Formulários de suporte (já usando)
- **Mailgun** → Links de auth (signup, password reset, team invite)

**Por que Mailgun?**
- ✅ 5.000 emails/mês gratuito
- ✅ Fácil integrar com Supabase
- ✅ Confiável e rápido
- ✅ Suporte 24/7
- ✅ Dashboard bom para debug

---

## 🚀 Como Configurar Mailgun

### Passo 1: Criar Conta

1. Acesse https://www.mailgun.com
2. Clique em **Sign Up** (escolha **Free** plan)
3. Preencha seus dados
4. Confirme seu email
5. Escolha uma região (escolha **US** ou **EU** conforme sua localização)

### Passo 2: Pegar Chaves

1. No dashboard do Mailgun, vá para **Sending** → **Domain Settings**
2. Copie:
   - **API Key** (copie a que começa com `key-`)
   - **SMTP credentials** (Username: `postmaster@...`, Password: será a API Key)

### Passo 3: Configurar no Supabase

1. Vá para https://supabase.com/dashboard
2. Seu projeto **Velohub**
3. **Authentication** → **Email Provider** (ou **Settings**)
4. Escolha **Mailgun** na lista
5. Preencha:
   - **Mailgun Domain**: seu domínio (ex: `mg.velohub.com`)
   - **Mailgun API Key**: copie da dashboard
6. Clique **Save**

### Passo 4: Testar

1. Crie uma nova conta no Velohub
2. Verifique se o email de confirmação chegou
3. Se não chegou, vá para **Mailgun** → **Logs** e veja o status

---

## 🔧 Alternativas (Se Mailgun Não Funcionar)

### Opção 2: SendGrid

1. Acesse https://sendgrid.com
2. Sign up (escolha **Free**)
3. Gere **API Key** (Settings → API Keys)
4. No Supabase, escolha **SendGrid** e cole a chave
5. **Limitação**: 100 emails/dia (cuidado com convites em massa)

### Opção 3: Brevo (Sendinblue)

1. Acesse https://www.brevo.com
2. Sign up
3. No painel, vá para **SMTP & API** → copie **API Key v3**
4. No Supabase, escolha **Brevo** (pode estar como "Sendinblue")
5. **Vantagem**: 300 emails/dia (melhor para volume)

### Opção 4: AWS SES (Máximo Gratuito)

1. Crie conta AWS
2. Acesse **SES** (Simple Email Service)
3. Peça para sair do modo **Sandbox** (mais complexo)
4. Gere **SMTP credentials**
5. No Supabase, use como **SMTP personalizado**
6. **Vantagem**: 62.000 emails/mês em sandbox

---

## 📊 Qual Escolher?

### ✅ Mailgun (RECOMENDADO para você)
- Você usa Resend para suporte (300 emails/mês)
- Mailgun para auth (estimado 100-500/mês)
- Total: ~400-800/mês = Sobra muito do limite
- Fácil de integrar
- Boa documentação

### ✅ SendGrid (Se preferir tudo em um lugar)
- Um único provedor
- Mas 100/dia é apertado se tiver picos
- Ideal para apps pequenos

### ✅ Brevo (Se quiser máximo volume)
- 300 emails/dia é bastante
- UI fica em português
- Bom para expansão futura

### ✅ AWS SES (Se quiser futuro-proof)
- Máximo volume gratuito
- Mais complexo de configurar
- Ideal para grandes escalas

---

## 💡 Recomendação Final

Para seu projeto **Velohub**, sugiro:

```
Resend (Suporte) + Mailgun (Auth)
```

**Por que?**
1. Já tem Resend funcionando
2. Mailgun é o melhor custo/benefício
3. Separar fornecedores = redundância (se um cair, outro funciona)
4. 5.000 + 3.000 = 8.000 emails/mês total (confortável)

Se no futuro crescer muito, migra para AWS SES.

---

## 🔗 Links Úteis

- **Mailgun**: https://www.mailgun.com
- **SendGrid**: https://sendgrid.com
- **Brevo**: https://www.brevo.com
- **AWS SES**: https://aws.amazon.com/ses/
- **Supabase Email Providers Docs**: https://supabase.com/docs/guides/auth/auth-smtp
