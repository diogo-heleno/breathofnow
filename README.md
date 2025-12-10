# Breath of Now - Alterações Dezembro 2024

Este pacote contém **apenas** os 13 ficheiros novos ou modificados.

## 📁 Ficheiros Incluídos

### NOVOS (criar estas pastas/ficheiros):
```
src/contexts/
├── auth-context.tsx      # Contexto de autenticação
└── index.ts              # Exports

src/components/shell/
├── app-shell.tsx         # Menu comum para todas as apps
└── index.ts              # Exports

src/components/pwa/
└── connection-indicator.tsx  # Indicador online/offline

src/app/[locale]/account/
├── page.tsx              # Página da conta
└── settings/
    └── page.tsx          # Settings da conta

docs/supabase/
└── profiles-subscriptions-schema.sql  # SQL para Supabase

docs/
└── DECEMBER-2024-IMPROVEMENTS.md  # Documentação
```

### MODIFICADOS (substituir os existentes):
```
src/app/[locale]/layout.tsx           # Adicionado AuthProvider
src/app/[locale]/offline/page.tsx     # Página offline melhorada
src/app/[locale]/fitlog/page.tsx      # Link do questionário
src/components/layout/header.tsx      # Indicador de conexão
```

## 🚀 Instruções

### 1. No GitHub:

1. Vai ao teu repositório `breathofnow`
2. Para cada ficheiro **NOVO**, cria o ficheiro/pasta
3. Para cada ficheiro **MODIFICADO**, abre e substitui o conteúdo

### 2. Criar pastas novas (se não existirem):
- `src/contexts/`
- `src/components/shell/`
- `src/app/[locale]/account/`
- `src/app/[locale]/account/settings/`

### 3. No Supabase:
1. Vai a **SQL Editor**
2. Cola o conteúdo de `docs/supabase/profiles-subscriptions-schema.sql`
3. Executa

### 4. Verificar no Claude Code:
Depois de tudo, usa a prompt de verificação que te dei.

## ⚠️ Ordem Importante

1. Primeiro cria as pastas `src/contexts/` e `src/components/shell/`
2. Depois adiciona os ficheiros
3. Por fim modifica os ficheiros existentes

Isto evita erros de imports!
