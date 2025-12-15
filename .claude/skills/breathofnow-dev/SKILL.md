---
name: breathofnow-dev
description: Master skill for Breath of Now development. Provides comprehensive project context, architecture guidelines, and development workflows. Auto-invoked for all development tasks in the project.
---

# Breath of Now Development Skill

Este é o skill master para desenvolvimento do ecossistema Breath of Now - uma coleção privacy-first de micro-apps para vida consciente.

## Visão Geral

**Breath of Now** é um ecossistema de micro-apps sob **M21 Global, Lda**.

### Filosofia Core
- **Privacy First**: Todos os dados locais por defeito
- **Conscious Minimalism**: Apps simples e focadas
- **Data Sovereignty**: Utilizadores são donos dos dados
- **Acessibilidade**: Preços regionais, múltiplos idiomas

### Apps no Ecossistema

| App | Estado | Descrição |
|-----|--------|-----------|
| ExpenseFlow | ✅ Live | Gestão de despesas |
| FitLog | ✅ Live | Registo de treinos |
| InvestTrack | 🔜 Em breve | Tracking de investimentos |
| RecipeBox | 🔜 Em breve | Gestão de receitas |
| LabelScan | 🔜 Em breve | Scanner de etiquetas |

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State | Zustand (apenas UI) |
| Local DB | Dexie.js (IndexedDB) |
| Backend | Supabase (auth + sync opcional) |
| i18n | next-intl |
| Hosting | Vercel |

## Estrutura de Pastas

```
breathofnow/
├── .claude/                     # Documentação Claude Code
│   ├── skills/                  # Skills para Claude
│   ├── commands/                # Comandos slash
│   ├── PROJECT.md               # Visão geral
│   ├── RULES.md                 # Regras de código
│   ├── supabase-schema.md       # Schema da BD
│   ├── INIT-PROMPT.md           # Prompt de inicialização
│   └── CLOSE-PROMPT.md          # Prompt de fecho
├── messages/                    # Ficheiros de tradução (5 idiomas)
│   ├── en.json, pt.json, pt-BR.json, es.json, fr.json
├── src/
│   ├── app/[locale]/            # Páginas localizadas
│   │   ├── expenses/            # ExpenseFlow
│   │   ├── fitlog/              # FitLog
│   │   ├── account/             # Conta do utilizador
│   │   └── auth/                # Autenticação
│   ├── components/
│   │   ├── ui/                  # Design system
│   │   ├── expenses/            # Componentes ExpenseFlow
│   │   ├── fitlog/              # Componentes FitLog
│   │   ├── shell/               # App shell unificado
│   │   └── layout/              # Header, Footer
│   ├── lib/
│   │   ├── db/                  # Dexie database
│   │   ├── supabase/            # Clientes Supabase
│   │   └── sync/                # Sync engine
│   ├── stores/                  # Zustand stores
│   └── hooks/                   # Custom hooks
└── docs/                        # Documentação adicional
```

## Princípios de Desenvolvimento

### Princípio 1: Não Criar Mais Apps - Melhorar o que Temos

Foco em:
- Melhorias de infraestrutura
- Bug fixes
- Optimização de performance
- Refinamento de UX

### Princípio 2: Local-First Sempre

```typescript
// ✅ CORRECTO: Ler de IndexedDB
const expenses = await db.expenses.toArray();

// ❌ ERRADO: Ler de Supabase
const { data } = await supabase.from('expenses').select('*');
```

### Princípio 3: Zero Texto Hardcoded

```typescript
// ✅ CORRECTO
const t = useTranslations('Component');
<h1>{t('title')}</h1>

// ❌ ERRADO
<h1>Welcome</h1>
```

### Princípio 4: TypeScript Strict Mode

```typescript
// ✅ CORRECTO: Tipos explícitos
interface Props {
  expense: Expense;
  onDelete: (id: string) => void;
}

// ❌ ERRADO: any types
const handleClick = (data: any) => { ... }
```

### Princípio 5: Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Ficheiros | kebab-case | `expense-chart.tsx` |
| Componentes | PascalCase | `ExpenseChart` |
| Funções | camelCase | `handleClick` |
| DB Columns | snake_case | `apps_selected_at` |
| TypeScript | camelCase | `appsSelectedAt` |

## Design System

### Cores
- **Primary**: `#5a7d5a` (Warm Sage Green)
- **Secondary**: `#b19373` (Warm Sand)
- **Accent**: `#df7459` (Soft Terracotta)

### Fontes
- **Títulos**: Fraunces (`font-display`)
- **Corpo**: Source Sans 3 (`font-body`)
- **Mono**: JetBrains Mono (`font-mono`)

### Componentes UI
Em `@/components/ui/`:
- Button, Input, Card, Badge, PriceSlider

### Animações
- `animate-fade-in`, `animate-breathe`, `animate-float`
- `animate-scale-in`, `animate-slide-in-right`

## Idiomas Suportados

| Código | Idioma | Prioridade |
|--------|--------|------------|
| en | English | Primary |
| pt | Português (Portugal) | Alta |
| pt-BR | Português (Brasil) | Alta |
| es | Español | Média |
| fr | Français | Média |

## Tiers de Monetização

| Tier | Preço | Funcionalidades |
|------|-------|-----------------|
| Free | €0 | Todas as apps, com anúncios |
| Supporter | €1.99-5/mês | Sem anúncios, cloud sync |
| Founding Member | €599 lifetime | Tudo + lugares limitados |

## Skills Relacionados

Este skill funciona com:
- `frontend-design`: Guidelines de UI/UX
- `i18n-enforcer`: Enforcement de traduções
- `local-first`: Arquitectura de dados
- `code-review`: Garantia de qualidade

## Comandos Rápidos

```bash
# Desenvolvimento
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

## Ficheiros Críticos para Consulta

- `.claude/PROJECT.md` - Visão geral detalhada
- `.claude/RULES.md` - Regras de código
- `.claude/supabase-schema.md` - Schema da BD (SEMPRE consultar antes de queries)

## Domínio

- **Main**: breathofnow.site
- **App**: app.breathofnow.site

---

Lembra-te: Cada feature deve alinhar com a missão de **ajudar pessoas a viver mais conscientemente** enquanto **respeita a sua privacidade**.
