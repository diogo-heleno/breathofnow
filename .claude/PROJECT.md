# Documento de Projeto - Breath of Now

> Última atualização: Dezembro 2024

---

## 1. Visão Geral do Projeto

**Breath of Now** é um ecossistema privacy-first de micro-apps para vida consciente, uma marca da **M21 Global, Lda**.

### Apps do Ecossistema

| App | Estado | Descrição |
|-----|--------|-----------|
| **ExpenseFlow** | ✅ Disponível | Gestão de despesas |
| **InvestTrack** | 🔜 Em breve | Tracking de investimentos |
| **FitLog** | ✅ Disponível | Registo de fitness/treinos |
| **StravaSync** | 🔜 Em breve | Integração com Strava |
| **RecipeBox** | 🔜 Em breve | Gestão de receitas |
| **LabelScan** | 🔜 Em breve | Scanner de etiquetas/produtos |

---

## 2. Stack Tecnológico (Implementado)

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Framework** | Next.js (App Router) | 14.2.5 |
| **UI Library** | React | 18.3.1 |
| **Linguagem** | TypeScript (strict mode) | 5.5.4 |
| **Styling** | Tailwind CSS | 3.4.7 |
| **Ícones** | Lucide React | 0.424.0 |
| **State Management** | Zustand | 4.5.4 |
| **Local Database** | Dexie.js (IndexedDB) | 4.0.8 |
| **Backend/Auth** | Supabase | 2.45.0 |
| **i18n** | next-intl | 3.17.2 |
| **Hosting** | Vercel | - |
| **Repositório** | GitHub | - |

---

## 3. Arquitetura Local-First (Implementada)

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ IndexedDB   │  │ Zustand     │               │
│  │ (Dexie.js)  │  │ (State)     │               │
│  └──────┬──────┘  └──────┬──────┘               │
│         │                │                       │
│         └────────┬───────┘                       │
│                  ▼                               │
│         ┌───────────────┐                        │
│         │  Sync Engine  │  (a implementar)       │
│         └───────┬───────┘                        │
└─────────────────┼───────────────────────────────┘
                  │ (quando online + autenticado)
                  ▼
         ┌───────────────┐
         │   Supabase    │
         │  (opcional)   │
         └───────────────┘
```

---

## 4. Estrutura de Pastas (Atual)

```
breathofnow/
├── messages/                    # Ficheiros de tradução (5 idiomas)
│   ├── en.json
│   ├── pt.json
│   ├── pt-BR.json
│   ├── es.json
│   └── fr.json
├── src/
│   ├── app/[locale]/            # Páginas localizadas (App Router)
│   │   ├── layout.tsx           # Layout raiz com i18n
│   │   ├── page.tsx             # Homepage
│   │   ├── pricing/page.tsx     # Página de preços
│   │   ├── faq/page.tsx         # FAQ
│   │   ├── auth/signin/page.tsx # Autenticação
│   │   ├── privacy/page.tsx     # Política de privacidade
│   │   ├── terms/page.tsx       # Termos de serviço
│   │   └── globals.css          # Estilos globais
│   ├── components/
│   │   ├── ui/                  # Design system
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── price-slider.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── brand/
│   │   │   └── logo.tsx
│   │   └── ads/
│   │       └── ad-banner.tsx
│   ├── lib/
│   │   ├── db/index.ts          # Dexie database setup
│   │   ├── supabase/
│   │   │   ├── client.ts        # Cliente browser
│   │   │   └── server.ts        # Cliente server
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-mounted.ts       # Hook para client-side mount detection
│   │   ├── use-premium.ts       # Hook para premium features
│   │   ├── use-service-worker.ts # Hook para PWA service worker
│   │   └── use-sync.ts          # Hook para sincronização
│   ├── stores/
│   │   └── app-store.ts         # Zustand stores
│   ├── i18n.ts                  # Configuração i18n
│   └── middleware.ts            # Locale + geo detection
├── tailwind.config.ts           # Design tokens
├── next.config.mjs              # Next.js config
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 5. Internacionalização (Implementada)

### Idiomas Suportados

- 🇬🇧 English (en)
- 🇵🇹 Português (pt)
- 🇧🇷 Português Brasil (pt-BR)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)

### Preços Regionais

| Tier | Países | Multiplicador |
|------|--------|---------------|
| **Alto** | US, GB, DE, FR, CH | 1.0x |
| **Médio** | PT, ES, IT | 0.6x |
| **Baixo** | BR, AO, MZ | 0.3x |

---

## 6. Modelo de Monetização (3 Tiers)

| Tier | Preço | Funcionalidades |
|------|-------|-----------------|
| **Free** | €0 | Todas as apps, com anúncios |
| **Supporter** | €1.99-5/mês | Todas as apps, sem anúncios, sync cloud |
| **Founding Member** | €599 lifetime | Tudo incluído + lugares limitados |

### Objetivos de Receita

- **MAU Target**: 10,000 utilizadores
- **Conversão**: 3% (300 pagantes)
- **Receita Mensal Target**: €3,000
  - Anúncios: €200-400/mês
  - Subscriptions: €1,500-2,000/mês
  - Lifetime: €800-1,000/mês

---

## 7. Schema da Base de Dados Local (Dexie)

### UserPreferences

```typescript
{
  id?: number;
  theme: 'light' | 'dark' | 'system';
  locale: string;
  currency: string;
  country: string;
  isPremium: boolean;
  premiumUntil?: Date;
  showAds: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}
```

### Expense (ExpenseFlow)

```typescript
{
  amount: number;
  currency: string;
  category: string;
  description?: string;
  date: Date;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
```

### Investment (InvestTrack)

```typescript
{
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'crypto' | 'bond' | 'other';
  quantity: number;
  averagePrice: number;
  currency: string;
  broker?: string;
  notes?: string;
}
```

### Workout (FitLog)

```typescript
{
  name: string;
  type: string;
  duration: number; // minutos
  calories?: number;
  exercises?: WorkoutExercise[];
  notes?: string;
  date: Date;
}
```

### Recipe (RecipeBox)

```typescript
{
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings: number;
  prepTime?: number;
  cookTime?: number;
  tags?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  isFavorite?: boolean;
}
```

---

## 8. Autenticação (Implementada)

### Métodos

- ✅ Magic Link (OTP via email)
- ✅ OAuth Google
- ✅ OAuth GitHub

### Modelo User

```typescript
{
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumUntil?: string;
}
```

---

## 9. Design System (Implementado)

### Paleta de Cores

- **Primary** (Warm Sage Green): `#5a7d5a` - calma, respiração, natureza
- **Secondary** (Warm Sand): `#b19373` - terra, grounding
- **Accent** (Soft Terracotta): `#df7459` - energia, warmth
- **Neutrals**: Escala 50-950 de cinzas quentes

### Tipografia

- **Display**: Fraunces (serif elegante para títulos)
- **Body**: Source Sans 3 (sans-serif legível)
- **Mono**: JetBrains Mono (código/números)

### Componentes UI

| Componente | Variantes | Estado |
|------------|-----------|--------|
| **Button** | primary, secondary, outline, ghost, accent, danger | ✅ |
| **Input** | com label, erro, hint, ícones | ✅ |
| **Card** | default, interactive, glass | ✅ |
| **Badge** | primary, secondary, accent, success, warning, error, outline | ✅ |
| **PriceSlider** | PWYW com min/max | ✅ |
| **Logo** | sm, md, lg | ✅ |
| **AdBanner** | top, bottom, inline | ✅ |
| **Header** | com navegação mobile | ✅ |
| **Footer** | 4 colunas + newsletter | ✅ |
| **ClientOnly** | fallback | ✅ |

### Animações

- `fade-in`, `fade-in-up`, `fade-in-down`
- `scale-in`, `slide-in-right`, `slide-in-left`
- `float`, `pulse-soft`, `shimmer`, `breathe`

### Sombras

- `shadow-soft-sm/md/lg/xl`
- `shadow-glow`, `shadow-glow-accent`
- `shadow-inner-soft`

---

## 10. Páginas Implementadas

| Página | Rota | Estado |
|--------|------|--------|
| Homepage | `/[locale]` | ✅ |
| Pricing | `/[locale]/pricing` | ✅ |
| FAQ | `/[locale]/faq` | ✅ |
| Sign In | `/[locale]/auth/signin` | ✅ |
| Privacy | `/[locale]/privacy` | ✅ |
| Terms | `/[locale]/terms` | ✅ |
| Dashboard | `/[locale]/dashboard` | 🔜 |
| ExpenseFlow Dashboard | `/[locale]/expenses` | ✅ |
| ExpenseFlow Add | `/[locale]/expenses/add` | ✅ |
| ExpenseFlow Transactions | `/[locale]/expenses/transactions` | ✅ |
| ExpenseFlow Categories | `/[locale]/expenses/categories` | ✅ |
| ExpenseFlow Settings | `/[locale]/expenses/settings` | ✅ |
| ExpenseFlow Reports | `/[locale]/expenses/reports` | ✅ |
| Features - Privacy First | `/[locale]/features/privacy-first` | ✅ |
| Features - Works Offline | `/[locale]/features/works-offline` | ✅ |
| Features - Beautifully Simple | `/[locale]/features/beautifully-simple` | ✅ |
| Features - Fair Pricing | `/[locale]/features/fair-pricing` | ✅ |
| Features - Open Transparent | `/[locale]/features/open-transparent` | ✅ |
| Features - Sustainable | `/[locale]/features/sustainable` | ✅ |
| Account | `/[locale]/account` | ✅ |

---

## 11. State Management (Zustand)

### AppStore

```typescript
{
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  country: string;
  currency: string;
  priceTier: 'high' | 'medium' | 'low';
  isSidebarOpen: boolean;
  showAds: boolean;
  activeApp: string | null;
}
```

### PricingStore

```typescript
{
  suggestedMonthly: number;
  suggestedLifetime: number;
  customMonthly: number | null;
  customLifetime: number | null;
  getEffectiveMonthly(): number;
  getEffectiveLifetime(): number;
}
```

---

## 12. Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GA_MEASUREMENT_ID= (opcional)
NEXT_PUBLIC_ADSENSE_CLIENT_ID= (opcional)
```

---

## 13. Convenções de Código

### Commits

```
feat(expenses): add recurring transaction support
fix(sync): resolve conflict in offline merge
docs(readme): update installation steps
chore(deps): update dependencies
```

### Nomenclatura

- **Ficheiros**: kebab-case (`price-slider.tsx`)
- **Componentes**: PascalCase (`PriceSlider`)
- **Funções/variáveis**: camelCase (`handleClick`)
- **Tabelas DB**: snake_case, plural (`expense_transactions`)
- **Colunas DB**: snake_case (`created_at`)

### TypeScript

- Strict mode sempre ativo
- Componentes funcionais com hooks
- Path aliases para imports limpos (`@/components`, `@/lib`)

---

## 14. Próximos Passos

### Concluído

- [x] Criar CRUD de ExpenseFlow (transações)
- [x] Dashboard de visualizações/gráficos (ExpenseFlow)
- [x] Export de dados (JSON)
- [x] Configurar RLS no Supabase (ExpenseFlow)
- [x] Schema Supabase para ExpenseFlow

### Prioridade Alta

- [ ] Implementar dashboard principal (home)
- [ ] Implementar sync engine com Supabase
- [x] Configurar subdomínios (www + app)
- [ ] PWA com Service Worker

### Prioridade Média

- [ ] Import de dados (JSON/CSV)
- [ ] Sistema de notificações
- [ ] Budgets/Orçamentos no ExpenseFlow

### Prioridade Baixa

- [ ] InvestTrack completo
- [ ] FitLog app
- [ ] RecipeBox app
- [ ] Integração Strava API

---

## 15. Domínios e Infraestrutura

### Estrutura de Domínios

| Domínio | Propósito | Configuração |
|---------|-----------|--------------|
| **www.breathofnow.site** | Website/Landing Page | Vercel + DNS CNAME |
| **app.breathofnow.site** | Aplicações (ExpenseFlow, etc.) | Vercel + DNS CNAME |
| **API** | Backend/Auth | Supabase (managed) |

### Configuração Vercel

1. Adicionar ambos os domínios no projeto Vercel
2. Configurar redirects no `next.config.mjs` se necessário
3. Usar `NEXT_PUBLIC_SITE_URL` para o domínio principal

### Configuração DNS

```
www.breathofnow.site    CNAME   cname.vercel-dns.com
app.breathofnow.site    CNAME   cname.vercel-dns.com
breathofnow.site        A       76.76.21.21
```

---

## 16. Documentação Supabase

### Ficheiros de Referência

| Ficheiro | Descrição |
|----------|-----------|
| **supabase-schema.md** | Schema completo da base de dados |
| **claude-code-guide.md** | Guia de uso com Claude Code |
| **supabase/migrations/** | Migrações SQL versionadas |

### Regra de Ouro

> **SEMPRE consultar `.claude/supabase-schema.md` antes de escrever código que aceda à base de dados.**

### Nomes de Colunas Comuns

⚠️ **Atenção:** Supabase usa `snake_case`, TypeScript usa `camelCase`

| ❌ TypeScript (errado na DB) | ✅ Supabase (correto) |
|------------------------------|---------------------|
| `lastAppChange` | `apps_selected_at` |
| `subscriptionTier` | `subscription_tier` |
| `isFoundingMember` | `is_founding_member` |
| `fullName` | `full_name` |

### Workflow de Mudanças

1. **Fazer mudanças no Dashboard:** SQL Editor → `ALTER TABLE`
2. **Documentar:** Actualizar `.claude/supabase-schema.md`
3. **Criar migração:** Adicionar ficheiro em `supabase/migrations/`
4. **Commit:** GitHub com todas as alterações

### Ver Também

- [Supabase Schema Documentation](.claude/supabase-schema.md)
- [Claude Code Guide](.claude/claude-code-guide.md)

---

## 17. ExpenseFlow - Implementação Concluída

### Funcionalidades Phase 1 (MVP)

- ✅ Dashboard com resumo mensal
- ✅ Quick Add (despesas/rendimentos)
- ✅ Lista de transações com filtros e pesquisa
- ✅ Gráfico de pizza por categoria
- ✅ Gestão de categorias (CRUD)
- ✅ Página de configurações (moeda base, export)
- ✅ Relatórios anuais

### Estrutura de Ficheiros ExpenseFlow

```
src/
├── app/[locale]/expenses/
│   ├── layout.tsx          # Layout com navegação
│   ├── page.tsx            # Dashboard
│   ├── add/page.tsx        # Quick Add
│   ├── transactions/page.tsx
│   ├── categories/page.tsx
│   ├── settings/page.tsx
│   └── reports/page.tsx
├── components/expenses/
│   ├── expense-pie-chart.tsx
│   ├── transaction-item.tsx
│   └── edit-transaction-modal.tsx
└── stores/
    └── expense-store.ts    # Zustand store
```

### Schema Supabase

Ficheiro SQL: `docs/supabase/expenseflow-schema.sql`

Tabelas:
- `expense_categories`
- `expense_transactions`
- `expense_budgets`
- `expense_settings`
- `exchange_rates`
- `import_mappings`

---

> Este documento reflete o estado atual do projeto. Atualizar conforme o desenvolvimento avança.
