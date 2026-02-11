# ⚡ Guia Rápido - Email Não Funciona?

## 🚀 Solução Imediata (Desenvolvimento)

Se você quer **testar rápido** e não quer configurar email agora:

### Desabilitar Verificação de Email (Dev Only)

1. Acesse https://supabase.com/dashboard
2. Vá para seu projeto **Velohub**
3. Menu lateral → **Authentication** → **Settings**
4. Procure por **"Require email verification"**
5. **Desmarque** ☐ a opção
6. Clique em **Save**

Agora:
- ✅ Usuários se registram **sem validar email**
- ✅ Login funciona imediatamente
- ✅ Sem necessidade de configurar Resend/SendGrid

⚠️ **IMPORTANTE**: 
- Isso é **APENAS para desenvolvimento**
- Antes de ir para produção, **re-enable** essa opção
- E configure um email provider (Resend/SendGrid)

---

## 📧 Para Produção (Obrigatório)

Quando for colocar em produção, você **PRECISA** de email funcional:

1. **Criar conta no Resend** → https://resend.com
2. **Seguir o guia completo** em `docs/SETUP_EMAIL_CONFIGURATION.md`
3. **Re-habilitar** email verification no Supabase
4. **Testar** antes de publicar

---

## ✅ Checklist de Configuração

- [ ] Criei conta no Resend (https://resend.com)
- [ ] Copiei minha API Key do Resend
- [ ] Configurei a chave no Supabase (Authentication → Provider)
- [ ] Testei criando uma nova conta
- [ ] Recebi o email de confirmação
- [ ] Cliquei no link e confirmei a conta
- [ ] Conseguir fazer login normalmente
