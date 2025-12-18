# 🌿 Breath of Now - Prompt de Inicialização para Claude Code

> **Versão:** 2.0 | **Última atualização:** Dezembro 2024

---

## 📋 INSTRUÇÕES DE INICIALIZAÇÃO

Olá Claude Code! Vou trabalhar no projeto **Breath of Now**.

**ANTES de começares QUALQUER tarefa, segue OBRIGATORIAMENTE estes passos:**

---

### 1️⃣ LEITURA OBRIGATÓRIA DE DOCUMENTOS (por esta ordem)

```
.claude/PROJECT.md          → Visão geral do projeto
.claude/RULES.md            → Regras de desenvolvimento (CRÍTICO)
.claude/TODO.md             → Próximos passos pendentes
.claude/supabase-schema.md  → Schema da base de dados (NUNCA assumir nomes)
.claude/claude-code-guide.md → Guia de boas práticas
```

### 2️⃣ CARREGAR SKILLS (todos em `.claude/skills/`)

| Skill | Ficheiro | Quando usar |
|-------|----------|-------------|
| **breathofnow-dev** | `SKILL.md` | Sempre - contexto geral do projeto |
| **frontend-design** | `SKILL.md` | UI, componentes, design system |
| **i18n-enforcer** | `SKILL.md` | SEMPRE - texto hardcoded = erro |
| **local-first** | `SKILL.md` | Qualquer operação com dados |
| **code-review** | `SKILL.md` | Antes de finalizar qualquer código |

### 3️⃣ VERIFICAR FICHEIROS CRÍTICOS

```
src/lib/db/index.ts      → Dexie database (IndexedDB)
src/stores/app-store.ts  → Zustand stores
messages/*.json          → Traduções (en, pt, pt-BR, es, fr)
tailwind.config.ts       → Design tokens, cores, tipografia
```

---

## 🏗️ CONTEXTO DO PROJETO

### Stack Tecnológico

| Camada | Tecnologia | Notas |
|--------|------------|-------|
| Framework | Next.js 14 (App Router) | Strict mode TypeScript |
| UI | React 18 + Tailwind CSS | Design system próprio |
| State | Zustand | Global state |
| DB Local | Dexie.js (IndexedDB) | **SOURCE OF TRUTH** |
| Backend | Supabase | Opcional, só sync premium |
| i18n | next-intl | 5 idiomas obrigatórios |
| Hosting | Vercel | breathofnow.site |

### Arquitetura Local-First (CRÍTICO)

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ IndexedDB   │◄─┤ Zustand     │               │
│  │ (Dexie.js)  │  │ (State)     │               │
│  │   SOURCE    │  └─────────────┘               │
│  │  OF TRUTH   │                                │
│  └──────┬──────┘                                │
│         │ (só se premium + online)              │
└─────────┼───────────────────────────────────────┘
          ▼
  ┌───────────────┐
  │   Supabase    │  ← OPCIONAL, nunca obrigatório
  └───────────────┘
```

**REGRA DE OURO:** Dados do utilizador vão para **Dexie PRIMEIRO**, nunca diretamente para Supabase.

### Apps do Ecossistema

| App | Estado | Subdomínio |
|-----|--------|------------|
| ExpenseFlow | ✅ Live | expenses.breathofnow.site |
| InvestTrack | 🧪 Beta | invest.breathofnow.site |
| FitLog | 🔜 Breve | - |
| StravaSync | 🔜 Breve | - |
| RecipeBox | 🔜 Breve | - |
| LabelScan | 🔜 Breve | - |

---

## ⚠️ REGRAS INVIOLÁVEIS

### 🌍 Internacionalização (ZERO EXCEÇÕES)

```typescript
// ❌ PROIBIDO - Texto hardcoded
<h1>Welcome to Breath of Now</h1>
<button>Save</button>
<p>Loading...</p>

// ✅ OBRIGATÓRIO - Sempre usar traduções
import { useTranslations } from 'next-intl';
const t = useTranslations('common');

<h1>{t('welcome')}</h1>
<button>{t('actions.save')}</button>
<p>{t('states.loading')}</p>
```

**Idiomas suportados:** `en`, `pt`, `pt-BR`, `es`, `fr`

**Namespaces de tradução:**
- `common` → Textos globais (botões, estados, erros)
- `nav` → Navegação
- `apps` → Nomes e descrições das apps
- `pricing` → Página de preços
- `auth` → Autenticação
- `dashboard` → Dashboard
- `[app-name]` → Traduções específicas de cada app

### 🗄️ Convenções de Base de Dados

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Supabase (tabelas) | snake_case, plural | `user_preferences` |
| Supabase (colunas) | snake_case | `created_at`, `user_id` |
| TypeScript (types) | camelCase | `createdAt`, `userId` |
| Dexie (stores) | camelCase | `userPreferences` |

**NUNCA assumes nomes de colunas** - consulta SEMPRE `.claude/supabase-schema.md`

### 📁 Estrutura de Pastas

```
src/
├── app/[locale]/           # Páginas (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── [feature]/page.tsx
├── components/
│   ├── ui/                 # Design system (Button, Input, Card...)
│   ├── layout/             # Header, Footer, Sidebar
│   ├── features/           # Componentes específicos de features
│   └── shared/             # Componentes reutilizáveis
├── lib/
│   ├── db/                 # Dexie setup
│   ├── supabase/           # Clientes Supabase
│   └── utils/              # Utilitários
├── stores/                 # Zustand stores
├── hooks/                  # Custom hooks
└── types/                  # TypeScript types
```

---

## 🎨 DESIGN SYSTEM

### Cores (usar via Tailwind)

```
Primary (Sage Green):    bg-primary, text-primary     → #5a7d5a
Secondary (Sand):        bg-secondary, text-secondary → #b19373
Accent (Terracotta):     bg-accent, text-accent       → #df7459
```

### Tipografia

```
Títulos:  font-display (Fraunces)
Texto:    font-sans (Source Sans 3)
Código:   font-mono (JetBrains Mono)
```

### Componentes UI Disponíveis

```typescript
import { Button, Input, Card, Badge } from '@/components/ui';

// Variantes de Button
<Button variant="primary | secondary | outline | ghost | accent | danger" />

// Variantes de Card
<Card variant="default | interactive | glass" />
```

---

## 🔄 WORKFLOW DE DESENVOLVIMENTO

### Para QUALQUER Tarefa

```
1. LER documentação (.claude/*.md)
2. CARREGAR skills relevantes
3. VERIFICAR schema antes de queries
4. IMPLEMENTAR com i18n desde o início
5. TESTAR localmente
6. VERIFICAR com skill code-review
```

### Para Queries Supabase

```
1. Abrir .claude/supabase-schema.md
2. Identificar tabelas envolvidas
3. Copiar nomes EXACTOS das colunas
4. Lembrar: snake_case no Supabase
5. Converter para camelCase no TypeScript
```

### Para Componentes UI

```
1. Verificar se já existe em src/components/ui/
2. Usar design tokens do tailwind.config.ts
3. Seguir padrão dos componentes existentes
4. NUNCA hardcoded text - usar traduções
```

### Para Novas Features

```
1. Criar traduções PRIMEIRO (todos os 5 idiomas)
2. Implementar lógica de dados com Dexie
3. Criar componentes UI
4. Conectar tudo
5. Testar em todos os idiomas
```

---

## 📝 CHECKLIST PRÉ-COMMIT

Antes de considerar qualquer código como "pronto":

- [ ] TypeScript compila sem erros (`npm run build`)
- [ ] Zero texto hardcoded (verificar com grep)
- [ ] Traduções existem nos 5 idiomas
- [ ] Dados vão para Dexie primeiro
- [ ] Nomes de colunas Supabase verificados no schema
- [ ] Componentes UI seguem design system
- [ ] Código segue convenções de nomenclatura

---

## 🚫 O QUE NUNCA FAZER

```
❌ Hardcoded text em qualquer idioma
❌ Assumir nomes de colunas Supabase
❌ Guardar dados diretamente no Supabase (sem Dexie)
❌ Criar componentes UI do zero (usar existentes)
❌ Ignorar a documentação em .claude/
❌ Esquecer de adicionar traduções
❌ Usar cores/fontes fora do design system
```

---

## ✅ CONFIRMAÇÃO

Depois de leres TUDO acima, confirma que entendes:

1. **Stack:** Next.js 14, TypeScript strict, Tailwind, Supabase, Dexie
2. **Arquitectura:** Local-first (IndexedDB é source of truth)
3. **i18n:** 5 idiomas, ZERO texto hardcoded, sempre useTranslations()
4. **DB:** snake_case no Supabase, camelCase no TypeScript
5. **Design:** Fraunces títulos, Source Sans 3 texto, paleta sage/sand/terracotta

**Responde:** "Pronto! Li toda a documentação e skills. Aguardo a tua tarefa."

---

## 📚 REFERÊNCIA RÁPIDA

### Imports Comuns

```typescript
// Traduções
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

// UI Components
import { Button, Input, Card, Badge } from '@/components/ui';

// Database
import { db } from '@/lib/db';

// Supabase
import { createClient } from '@/lib/supabase/client';

// Store
import { useAppStore } from '@/stores/app-store';
```

### Padrão de Página

```typescript
// src/app/[locale]/exemplo/page.tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'exemplo' });
  return { title: t('meta.title') };
}

export default function ExemploPage() {
  const t = useTranslations('exemplo');
  
  return (
    <div>
      <h1 className="font-display text-3xl">{t('title')}</h1>
      <p className="font-sans">{t('description')}</p>
    </div>
  );
}
```

### Padrão de Dados (Local-First)

```typescript
// 1. Guardar em Dexie (SEMPRE PRIMEIRO)
await db.expenses.add({
  amount: 100,
  category: 'food',
  date: new Date(),
  // ...
});

// 2. Se premium + online, sync para Supabase
if (user.isPremium && navigator.onLine) {
  await syncToSupabase('expenses');
}
```

---

> **Lembra-te:** Este documento é a tua "bíblia" para o projeto. Consulta-o sempre que tiveres dúvidas!
