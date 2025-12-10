# Breath of Now - Melhorias Dezembro 2024

## 📋 Resumo das Melhorias

Este documento descreve as melhorias implementadas no projeto Breath of Now em Dezembro 2024.

---

## ✅ Melhorias Implementadas

### 1. Sistema de Autenticação e Contexto Global

**Ficheiros criados:**
- `src/contexts/auth-context.tsx` - Contexto de autenticação com gestão de perfil e subscriptions
- `src/contexts/index.ts` - Exports do contexto

**Funcionalidades:**
- Gestão de sessão com Supabase
- Perfil de utilizador com tier de subscription
- Verificação de acesso a apps por tier
- Integração com app store existente

### 2. Menu Shell Comum (AppShell)

**Ficheiros criados:**
- `src/components/shell/app-shell.tsx` - Layout comum para todas as apps
- `src/components/shell/index.ts` - Exports

**Funcionalidades:**
- Sidebar com navegação entre apps
- Header com indicador de conectividade
- Menu de utilizador com perfil e tier
- Selector de idioma
- Responsive (mobile e desktop)
- Indicação de apps bloqueadas por tier

### 3. Indicador Online/Offline

**Ficheiros criados:**
- `src/components/pwa/connection-indicator.tsx` - Componentes de indicador de conectividade

**Funcionalidades:**
- Ícone visual no header
- Tooltip com estado actual
- Versões normal e compacta
- Badge de sync status

### 4. Página de Conta do Utilizador

**Ficheiros criados:**
- `src/app/[locale]/account/page.tsx` - Página principal da conta
- `src/app/[locale]/account/settings/page.tsx` - Página de configurações

**Funcionalidades:**
- Visualização do perfil
- Estado da subscription
- Acesso a apps por tier
- Configurações de tema, região, notificações
- Gestão de dados locais
- Danger zone (delete account)

### 5. Página Offline Melhorada

**Ficheiro modificado:**
- `src/app/[locale]/offline/page.tsx`

**Funcionalidades:**
- Design melhorado
- Quick access às apps em cache
- Auto-redirect quando volta online
- Animações de transição

### 6. Link do Questionário no FitLog

**Ficheiro modificado:**
- `src/app/[locale]/fitlog/page.tsx`

**Funcionalidades:**
- Card destacado para criar plano com questionário
- Link adicional de ajuda
- Melhor UX para novos utilizadores

### 7. Schema SQL para Supabase

**Ficheiro criado:**
- `docs/supabase/profiles-subscriptions-schema.sql`

**Tabelas:**
- `profiles` - Perfis de utilizador com subscription info
- `subscription_history` - Histórico de alterações
- `founding_members` - Lista de membros fundadores (máx 100)
- `user_invites` - Sistema de convites

**Funcionalidades:**
- Row Level Security (RLS)
- Triggers automáticos para criação de perfil
- Functions para verificação de acesso
- View para app access

### 8. Indicador de Conectividade no Header Principal

**Ficheiro modificado:**
- `src/components/layout/header.tsx`

**Funcionalidades:**
- Ícone de conectividade ao lado do selector de idioma
- Visual feedback quando offline

---

## 🚀 Instruções de Deploy

### Passo 1: Actualizar o Repositório

```bash
# No GitHub, faz upload dos novos ficheiros ou usa Git
git add .
git commit -m "feat: add auth system, app shell, offline improvements"
git push
```

### Passo 2: Executar SQL no Supabase

1. Vai a **Supabase Dashboard** → **SQL Editor**
2. Copia o conteúdo de `docs/supabase/profiles-subscriptions-schema.sql`
3. Executa o SQL
4. Verifica se as tabelas foram criadas em **Table Editor**

### Passo 3: Configurar Auth Providers no Supabase

1. Vai a **Authentication** → **Providers**
2. Habilita e configura:
   - Email (já deve estar)
   - Google OAuth
   - GitHub OAuth

### Passo 4: Verificar Variáveis de Ambiente

No Vercel, verifica que estas variáveis existem:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://breathofnow.site
```

### Passo 5: Deploy

O deploy no Vercel deve ser automático após push para o GitHub.

---

## 📁 Estrutura de Ficheiros Novos

```
src/
├── contexts/
│   ├── auth-context.tsx     # NOVO
│   └── index.ts             # NOVO
├── components/
│   ├── shell/
│   │   ├── app-shell.tsx    # NOVO
│   │   └── index.ts         # NOVO
│   ├── pwa/
│   │   └── connection-indicator.tsx  # NOVO
│   └── layout/
│       └── header.tsx       # MODIFICADO
├── app/[locale]/
│   ├── account/
│   │   ├── page.tsx         # NOVO
│   │   └── settings/
│   │       └── page.tsx     # NOVO
│   ├── offline/
│   │   └── page.tsx         # MODIFICADO
│   ├── fitlog/
│   │   └── page.tsx         # MODIFICADO
│   └── layout.tsx           # MODIFICADO
docs/
└── supabase/
    └── profiles-subscriptions-schema.sql  # NOVO
```

---

## 📖 Como Usar o AppShell

Para usar o novo layout comum nas apps:

```tsx
import { AppShell } from '@/components/shell';

export default function MyAppPage({ params: { locale } }: PageProps) {
  return (
    <AppShell locale={locale}>
      {/* Conteúdo da app */}
    </AppShell>
  );
}
```

O AppShell inclui:
- Header com logo, indicador de conexão, idioma e menu de utilizador
- Sidebar com navegação entre apps
- Indicação de tier e apps disponíveis

---

## 🔜 Próximos Passos

1. **Integração Stripe** - Configurar webhooks para actualizar subscriptions
2. **App Selection UI** - Interface para Starter/Plus escolherem apps
3. **Hall of Fame** - Página pública com founding members
4. **Sync Engine** - Completar implementação de sync bidireccional

---

## ⚠️ Notas Importantes

1. **Regra do Projeto**: Não criar mais apps novas - melhorar as existentes
2. **AuthProvider**: Já está integrado no layout principal
3. **RLS**: As políticas de segurança estão configuradas no SQL
4. **Tiers**:
   - Free: acesso a tudo, com ads, sem cloud sync
   - Starter: 1 app escolhida, sem ads, Google Drive sync
   - Plus: 3 apps escolhidas, sem ads, cloud sync
   - Pro: todas as apps, sem ads, cloud sync
   - Founding: tudo para sempre
