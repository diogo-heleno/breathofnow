# ExpenseFlow - Product Requirements Document (PRD)

**Versão:** 2.0 (Web App - Breath of Now Ecosystem)  
**Data:** 9 de Dezembro de 2025  
**Autor:** Diogo / Claude  
**Estado:** Pronto para Desenvolvimento

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Integração no Ecossistema Breath of Now](#2-integração-no-ecossistema-breath-of-now)
3. [Objetivos e Métricas de Sucesso](#3-objetivos-e-métricas-de-sucesso)
4. [Princípios de Design](#4-princípios-de-design)
5. [Arquitetura Técnica](#5-arquitetura-técnica)
6. [Estrutura de Dados (Dexie.js)](#6-estrutura-de-dados)
7. [Funcionalidades por Módulo](#7-funcionalidades-por-módulo)
8. [User Flows Detalhados](#8-user-flows-detalhados)
9. [Páginas e Componentes](#9-páginas-e-componentes)
10. [Sistema de Localização (next-intl)](#10-sistema-de-localização)
11. [Sistema de Monetização (PWYW)](#11-sistema-de-monetização)
12. [Sistema de Sync e Backup](#12-sistema-de-sync-e-backup)
13. [Importação Universal de Dados](#13-importação-universal-de-dados)
14. [Sistema Multi-Moeda](#14-sistema-multi-moeda)
15. [Performance e Otimização](#15-performance-e-otimização)
16. [Segurança e Privacidade](#16-segurança-e-privacidade)
17. [Roadmap de Desenvolvimento](#17-roadmap-de-desenvolvimento)
18. [Riscos e Mitigações](#18-riscos-e-mitigações)

---

## 1. Visão Geral do Produto

### 1.1 Sumário Executivo

**ExpenseFlow** é uma web app de gestão de despesas pessoais e familiares, parte do ecossistema **Breath of Now**, que prioriza:

- **Velocidade extrema** no registo de despesas (< 3 segundos)
- **Privacidade total** com dados armazenados localmente (IndexedDB via Dexie.js)
- **Backup seguro** via Supabase (opcional, para utilizadores autenticados)
- **Partilha familiar** através de sync cloud
- **Acessibilidade global** com preços regionais "Pay What You Want"
- **Localização completa** em 5 idiomas (PT, PT-BR, EN, ES, FR)

### 1.2 Proposta de Valor

> *"As tuas finanças, no teu browser, partilhadas com quem tu escolhes."*

| Problema | Solução ExpenseFlow |
|----------|---------------------|
| Apps de despesas são lentas | Registo em < 3 segundos, offline-first |
| Dados financeiros em servidores externos | 100% local + sync opcional no Supabase |
| Partilha familiar complicada | Family groups via Supabase |
| Apps caras para mercados emergentes | Pay What You Want com preços regionais |
| Apps só em inglês | Localização nativa em 5 idiomas |

### 1.3 Target Audience

**Primário:**
- Casais e famílias que querem gerir despesas conjuntas
- Utilizadores preocupados com privacidade de dados financeiros
- Mercados lusófonos (Portugal, Brasil, PALOP)

**Secundário:**
- Freelancers que precisam de tracking de despesas
- Estudantes com orçamentos limitados
- Utilizadores que migram de Excel/papel

### 1.4 Posição no Ecossistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    BREATH OF NOW ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ExpenseFlow  │  │  InvestTrack │  │   FitLog     │          │
│  │  ✅ Em Dev    │  │  🧪 Beta     │  │  🔜 Breve    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  StravaSync  │  │  RecipeBox   │  │  LabelScan   │          │
│  │  🔜 Breve    │  │  🔜 Breve    │  │  🔜 Breve    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                   SHARED INFRASTRUCTURE                     ││
│  │  • Auth (Supabase)  • Sync Engine  • Design System         ││
│  │  • i18n (next-intl) • IndexedDB    • PWYW Payments         ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Integração no Ecossistema Breath of Now

### 2.1 Stack Partilhada (Já Implementada)

O ExpenseFlow utiliza exatamente a mesma stack do projeto principal:

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

### 2.2 Estrutura de Pastas (dentro do projeto existente)

```
breathofnow/
├── messages/                           # Traduções (adicionar chaves expenses.*)
│   ├── en.json
│   ├── pt.json
│   ├── pt-BR.json
│   ├── es.json
│   └── fr.json
├── src/
│   ├── app/[locale]/
│   │   ├── expenses/                   # 🆕 EXPENSEFLOW PAGES
│   │   │   ├── page.tsx                # Dashboard despesas
│   │   │   ├── add/page.tsx            # Quick Add
│   │   │   ├── transactions/page.tsx   # Lista transações
│   │   │   ├── categories/page.tsx     # Gestão categorias
│   │   │   ├── budgets/page.tsx        # Orçamentos
│   │   │   ├── import/page.tsx         # Import CSV/Excel
│   │   │   ├── reports/page.tsx        # Relatórios
│   │   │   ├── settings/page.tsx       # Configurações
│   │   │   └── layout.tsx              # Layout ExpenseFlow
│   │   └── ...                         # Páginas existentes
│   ├── components/
│   │   ├── ui/                         # Design system existente ✅
│   │   ├── expenses/                   # 🆕 COMPONENTES EXPENSEFLOW
│   │   │   ├── quick-add.tsx
│   │   │   ├── transaction-list.tsx
│   │   │   ├── transaction-item.tsx
│   │   │   ├── category-picker.tsx
│   │   │   ├── amount-input.tsx
│   │   │   ├── currency-select.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── budget-card.tsx
│   │   │   ├── spending-chart.tsx
│   │   │   ├── import-wizard.tsx
│   │   │   └── expense-stats.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                # Dexie setup existente ✅
│   │   │   ├── expenses.ts             # 🆕 Expense queries
│   │   │   ├── categories.ts           # 🆕 Category queries
│   │   │   └── sync.ts                 # 🆕 Sync logic
│   │   └── supabase/                   # Cliente existente ✅
│   ├── stores/
│   │   ├── app-store.ts                # Store existente ✅
│   │   └── expense-store.ts            # 🆕 ExpenseFlow store
│   ├── hooks/
│   │   ├── use-transactions.ts         # 🆕
│   │   ├── use-categories.ts           # 🆕
│   │   ├── use-budgets.ts              # 🆕
│   │   └── use-currency.ts             # 🆕
│   ├── services/
│   │   ├── currency-service.ts         # 🆕 Frankfurter API
│   │   └── import-service.ts           # 🆕 CSV/Excel parsing
│   └── types/
│       └── expenses.ts                 # 🆕 TypeScript types
└── ...
```

### 2.3 Routing

| Rota | Página | Descrição |
|------|--------|-----------|
| `/[locale]/expenses` | Dashboard | Visão geral + Quick Add |
| `/[locale]/expenses/add` | Quick Add | Adicionar despesa (mobile-first) |
| `/[locale]/expenses/transactions` | Lista | Todas as transações |
| `/[locale]/expenses/categories` | Categorias | Gerir categorias |
| `/[locale]/expenses/budgets` | Orçamentos | Definir e ver orçamentos |
| `/[locale]/expenses/import` | Import | Importar CSV/Excel |
| `/[locale]/expenses/reports` | Relatórios | Gráficos e análises |
| `/[locale]/expenses/settings` | Configurações | Moeda base, sync, export |

### 2.4 Design System (Reutilizar Existente)

O ExpenseFlow usa o design system já implementado:

**Cores do Breath of Now:**
- Primary: `#5a7d5a` (Warm Sage Green)
- Secondary: `#b19373` (Warm Sand)
- Accent: `#df7459` (Soft Terracotta)

**Cores Adicionais ExpenseFlow:**
- Expense: `#ef4444` (Red 500)
- Income: `#22c55e` (Green 500)
- Transfer: `#3b82f6` (Blue 500)

**Componentes a Reutilizar:**
- `Button`, `Input`, `Card`, `Badge` (todos existentes)
- `Header`, `Footer` (layout existente)

---

## 3. Objetivos e Métricas de Sucesso

### 3.1 North Star Metric

**Transações registadas por utilizador ativo por semana**

Target: ≥ 5 transações/semana/utilizador ativo

### 3.2 KPIs por Fase

| Fase | Métrica | Target |
|------|---------|--------|
| MVP (Mês 1-2) | Transações/dia (tu) | ≥ 3 |
| MVP | Tempo médio registo | < 5s |
| Beta (Mês 3-4) | Beta testers | 20-50 |
| Beta | Retenção D7 | ≥ 50% |
| Launch (Mês 5-6) | MAU | 500 |
| Launch | Conversão Free→Paid | ≥ 3% |

### 3.3 Objetivos de Receita (Web App)

| Período | MAU | Pagantes (4%) | Receita/mês |
|---------|-----|---------------|-------------|
| Mês 6 | 500 | 20 | ~€40 |
| Mês 12 | 2,000 | 80 | ~€160 |
| Mês 18 | 5,000 | 200 | ~€400 |
| Mês 24 | 10,000 | 400 | ~€800 |

---

## 4. Princípios de Design

### 4.1 Core Principles

1. **SPEED FIRST** - Quick Add em < 3 segundos
2. **PRIVACY BY DESIGN** - IndexedDB como fonte de verdade
3. **MOBILE-FIRST WEB** - Touch-friendly, responsive
4. **PROGRESSIVE DISCLOSURE** - Fácil começar, poderoso dominar
5. **ECOSYSTEM COHESION** - Mesmo design do Breath of Now

### 4.2 Design Tokens Adicionais

```typescript
// src/lib/design-tokens.ts

export const expenseColors = {
  expense: { light: '#fef2f2', DEFAULT: '#ef4444', dark: '#b91c1c' },
  income: { light: '#f0fdf4', DEFAULT: '#22c55e', dark: '#15803d' },
  transfer: { light: '#eff6ff', DEFAULT: '#3b82f6', dark: '#1d4ed8' },
};

export const categoryColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#78716c',
];
```

---

## 5. Arquitetura Técnica

### 5.1 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    NEXT.JS APP ROUTER                     │   │
│  │  /expenses  /expenses/add  /expenses/transactions  etc.  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    STATE MANAGEMENT                       │   │
│  │              Zustand (expense-store.ts)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  DEXIE.JS (IndexedDB)                     │   │
│  │  transactions | categories | budgets | settings | sync   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ (se online + autenticado)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                           SUPABASE                                │
│  AUTH: Magic Link, Google, GitHub                                │
│  DATABASE: expense_transactions, expense_categories, etc.        │
│  RLS: Row Level Security por user_id                             │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Fluxo de Dados

```
USER ACTION → React Component → Zustand Store → Dexie.js (IndexedDB)
                                    │
                                    └──→ UI Updated (instant)
                                    
[BACKGROUND - se online + auth]
Sync Engine → Supabase (cloud backup)
```

### 5.3 PWA Support

```json
// public/manifest.json
{
  "name": "ExpenseFlow - Breath of Now",
  "short_name": "ExpenseFlow",
  "start_url": "/expenses",
  "display": "standalone",
  "background_color": "#fafafa",
  "theme_color": "#5a7d5a"
}
```

---

## 6. Estrutura de Dados

### 6.1 Schema Dexie.js (IndexedDB)

```typescript
// src/lib/db/index.ts (adicionar ao existente)

import Dexie, { Table } from 'dexie';

// TYPES
export interface Transaction {
  id?: string;
  amount: number;
  currency: string;
  amountInBase?: number;
  exchangeRate?: number;
  type: 'income' | 'expense';
  description?: string;
  notes?: string;
  categoryId?: string;
  date: string;        // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  importBatchId?: string;
  isReviewed: boolean;
  deletedAt?: Date;
}

export interface Category {
  id?: string;
  name: string;
  icon: string;        // Lucide icon name
  color: string;       // Hex color
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Budget {
  id?: string;
  categoryId?: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
  createdAt: Date;
}

export interface ImportMapping {
  id?: string;
  name: string;              // "CGD Portugal", "Nubank BR"
  mappingJson: string;       // JSON com mapeamento
  delimiter: string;
  hasHeader: boolean;
  negativeIsExpense: boolean;
  useCount: number;
  createdAt: Date;
}

export interface ExpenseSettings {
  key: string;
  value: string;
}

// DATABASE CLASS
export class ExpenseFlowDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;
  exchangeRates!: Table<ExchangeRate>;
  importMappings!: Table<ImportMapping>;
  expenseSettings!: Table<ExpenseSettings>;

  constructor() {
    super('ExpenseFlowDB');
    
    this.version(1).stores({
      transactions: '++id, date, categoryId, type, syncStatus, deletedAt',
      categories: '++id, type, isDefault, deletedAt',
      budgets: '++id, categoryId, isActive',
      exchangeRates: '[fromCurrency+toCurrency+date]',
      importMappings: '++id, name',
      expenseSettings: 'key',
    });
  }
}

export const db = new ExpenseFlowDB();
```

### 6.2 Categorias Default

```typescript
export const defaultCategories = [
  // Expenses
  { name: 'Alimentação', icon: 'utensils', color: '#f97316', type: 'expense' },
  { name: 'Transportes', icon: 'car', color: '#3b82f6', type: 'expense' },
  { name: 'Casa', icon: 'home', color: '#8b5cf6', type: 'expense' },
  { name: 'Saúde', icon: 'heart-pulse', color: '#ef4444', type: 'expense' },
  { name: 'Lazer', icon: 'gamepad-2', color: '#22c55e', type: 'expense' },
  { name: 'Compras', icon: 'shopping-bag', color: '#ec4899', type: 'expense' },
  { name: 'Educação', icon: 'graduation-cap', color: '#14b8a6', type: 'expense' },
  { name: 'Outros', icon: 'ellipsis', color: '#6b7280', type: 'expense' },
  
  // Income
  { name: 'Salário', icon: 'briefcase', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: 'laptop', color: '#3b82f6', type: 'income' },
  { name: 'Investimentos', icon: 'trending-up', color: '#8b5cf6', type: 'income' },
  { name: 'Outros', icon: 'plus-circle', color: '#6b7280', type: 'income' },
];
```

### 6.3 Default Settings

```typescript
export const defaultSettings = {
  base_currency: 'EUR',
  default_transaction_currency: 'EUR',
  favorite_currencies: JSON.stringify(['EUR', 'USD', 'GBP', 'BRL']),
  date_format: 'DD/MM/YYYY',
  first_day_of_week: '1',  // Monday
};
```

### 6.4 Schema Supabase (Cloud Sync)

```sql
-- TRANSACTIONS
CREATE TABLE expense_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    amount_in_base DECIMAL(12,2),
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    description TEXT,
    category_id UUID,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    client_updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own" ON expense_transactions FOR ALL USING (auth.uid() = user_id);

-- CATEGORIES
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own" ON expense_categories FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- BUDGETS
CREATE TABLE expense_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT,
    category_id UUID,
    amount DECIMAL(12,2) NOT NULL,
    period TEXT NOT NULL,
    start_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own" ON expense_budgets FOR ALL USING (auth.uid() = user_id);
```

---

## 7. Funcionalidades por Módulo

### 7.1 MVP (P0)

| Feature | Descrição |
|---------|-----------|
| Quick Add | Adicionar despesa em < 3 segundos |
| Lista transações | Ver, filtrar, pesquisar |
| Categorias default | 8 expense + 4 income |
| Dashboard | Resumo do mês, gráfico simples |
| Offline-first | Funciona 100% sem internet |
| i18n | PT, PT-BR, EN mínimo |

### 7.2 Core (P1)

| Feature | Descrição |
|---------|-----------|
| Editar/eliminar | CRUD completo de transações |
| Multi-moeda | 150+ moedas via Frankfurter |
| Import CSV/Excel | Mapeamento manual |
| Export JSON | Backup manual |
| Categorias custom | Criar/editar categorias |
| PWA | Instalável no telemóvel |

### 7.3 Premium (P2)

| Feature | Descrição |
|---------|-----------|
| Sync Supabase | Backup automático |
| Multi-device | Aceder de qualquer browser |
| Family sharing | Partilhar com familiares |
| Orçamentos | Limites por categoria |
| Import LLM | Mapeamento assistido por AI |
| Export PDF | Relatórios |

---

## 8. User Flows Detalhados

### 8.1 Quick Add Flow (< 3 segundos)

```
STEP 1: Abrir (0.5s)
├── Navegar /expenses/add OU clicar FAB
└── Teclado numérico aparece

STEP 2: Inserir valor (1.0s)
├── Digitar valor (ex: 12.50)
└── Formato adapta à locale

STEP 3: Escolher categoria (1.0s)
├── Grid de categorias com ícones
├── Últimas usadas primeiro
└── Tap único para selecionar

STEP 4: Guardar (0.5s)
├── Clica "Guardar"
├── Feedback visual (toast)
└── Redireciona para dashboard

TOTAL: < 3 segundos
```

### 8.2 Import CSV Flow

```
STEP 1: Upload
└── Drag & drop ou selecionar ficheiro

STEP 2: Método de mapeamento
├── Manual (selecionar colunas)
├── Template guardado
└── Assistido por AI (copiar prompt)

STEP 3: Preview
├── Ver 10 transações convertidas
├── Ajustar categorias
└── Marcar duplicados

STEP 4: Confirmar
└── "Importar X transações"

STEP 5: Revisão
└── Lista para categorizar manualmente
```

---

## 9. Páginas e Componentes

### 9.1 Páginas

#### Dashboard (`/expenses`)

```tsx
export default function ExpenseDashboard() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <MonthSelector />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Despesas" value={expenses} color="expense" />
        <StatCard title="Receitas" value={income} color="income" />
        <StatCard title="Balanço" value={balance} />
        <StatCard title="Transações" value={count} />
      </div>
      
      <SpendingChart />
      <RecentTransactions limit={5} />
      <QuickAddFAB />
    </div>
  );
}
```

#### Quick Add (`/expenses/add`)

```tsx
export default function QuickAddPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <button onClick={goBack}>← Voltar</button>
        <h1>Nova Despesa</h1>
      </header>
      
      <main className="flex-1 p-4">
        <AmountInput autoFocus currency={currency} />
        <CategoryGrid selected={category} onSelect={setCategory} />
        <OptionalFields>
          <DatePicker />
          <Input placeholder="Descrição" />
        </OptionalFields>
      </main>
      
      <footer className="p-4 border-t">
        <Button className="w-full" onClick={save}>Guardar</Button>
      </footer>
    </div>
  );
}
```

### 9.2 Componentes Principais

| Componente | Descrição |
|------------|-----------|
| `AmountInput` | Input grande com seletor de moeda |
| `CategoryGrid` | Grid de categorias com ícones |
| `TransactionList` | Lista agrupada por dia |
| `TransactionItem` | Item com swipe actions |
| `CurrencySelect` | Popover com pesquisa |
| `SpendingChart` | Gráfico pie/bar de despesas |
| `ImportWizard` | Wizard multi-step para import |
| `BudgetCard` | Card com progresso do orçamento |

---

## 10. Sistema de Localização

### 10.1 Chaves de Tradução (adicionar a messages/*.json)

```json
{
  "expenses": {
    "title": "ExpenseFlow",
    "dashboard": {
      "title": "Dashboard",
      "thisMonth": "Este mês",
      "expenses": "Despesas",
      "income": "Receitas",
      "balance": "Balanço"
    },
    "quickAdd": {
      "title": "Nova Despesa",
      "amount": "Valor",
      "category": "Categoria",
      "save": "Guardar",
      "saved": "Despesa guardada!"
    },
    "categories": {
      "food": "Alimentação",
      "transport": "Transportes",
      "home": "Casa",
      "health": "Saúde",
      "leisure": "Lazer",
      "shopping": "Compras",
      "education": "Educação",
      "other": "Outros",
      "salary": "Salário",
      "freelance": "Freelance",
      "investments": "Investimentos"
    },
    "import": {
      "title": "Importar",
      "dragDrop": "Arrasta um ficheiro ou clica",
      "supported": "CSV, Excel (.xlsx, .xls)"
    }
  }
}
```

### 10.2 Formatos por Locale

```typescript
// Números: 1.234,56 (PT) vs 1,234.56 (EN)
// Datas: DD/MM/YYYY (PT) vs MM/DD/YYYY (EN)
// Moeda: €1.234,56 (PT) vs €1,234.56 (EN)
```

---

## 11. Sistema de Monetização

### 11.1 Tiers (Mesmo do Breath of Now)

| Tier | Preço | Features |
|------|-------|----------|
| **Free** | €0 | Tudo local, com ads banner |
| **Supporter** | €1-5/mês | Sem ads, sync cloud, family |
| **Founding** | €49-299 | Lifetime, todas as apps |

### 11.2 Features por Tier

```
FREE                           SUPPORTER
────                           ─────────
✅ Quick Add                   ✅ Tudo do Free
✅ Transações ilimitadas       ✅ Sem anúncios
✅ Categorias default          ✅ Sync cloud (Supabase)
✅ Dashboard e gráficos        ✅ Multi-device
✅ Import CSV/Excel            ✅ Family sharing (até 5)
✅ Multi-moeda                 ✅ Categorias custom
✅ Export JSON                 ✅ Backup automático
✅ Offline 100%                ✅ Export PDF
⚠️ Banner ads                 
❌ Sync cloud                  
```

### 11.3 Preços Regionais

| Tier | Países | Supporter | Founding |
|------|--------|-----------|----------|
| Alto | US, GB, DE, FR | €5/mês | €299 |
| Médio | PT, ES, IT | €3/mês | €149 |
| Baixo | BR, AO, MZ | €1.50/mês | €49 |

---

## 12. Sistema de Sync e Backup

### 12.1 Princípios

- **IndexedDB é fonte de verdade SEMPRE**
- **Todas as operações são locais primeiro**
- **Sync é background e opcional**

### 12.2 Sync Triggers

- Ao voltar online
- A cada 5 minutos (se online + auth)
- Manual (botão sync)
- Ao fazer login

### 12.3 Conflict Resolution

- Last-write-wins (client_updated_at)
- Conflitos marcados para revisão manual

### 12.4 Export/Import Manual (Free)

```typescript
// Export
const data = {
  version: 1,
  exportedAt: new Date().toISOString(),
  transactions: await db.transactions.toArray(),
  categories: await db.categories.toArray(),
  budgets: await db.budgets.toArray(),
};
return JSON.stringify(data);

// Import
await db.transaction('rw', db.transactions, db.categories, async () => {
  await db.transactions.bulkAdd(data.transactions);
  await db.categories.bulkAdd(data.categories);
});
```

---

## 13. Importação Universal de Dados

### 13.1 Formatos Suportados

| Formato | Extensões | Biblioteca |
|---------|-----------|------------|
| CSV | .csv, .txt | Papa Parse |
| Excel | .xlsx, .xls | SheetJS |

### 13.2 Métodos de Mapeamento

**A) Manual** - Selecionar coluna → campo

**B) Template** - Reutilizar mapeamento guardado

**C) AI-Assisted** - Copiar prompt → LLM → Colar JSON

### 13.3 LLM Prompt Template

```
Analisa esta amostra e dá-me o mapeamento JSON:

AMOSTRA:
[primeiras 5 linhas]

Responde com JSON:
{
  "mapping": {
    "date": { "column": "NOME", "format": "DD-MM-YYYY" },
    "amount": { "column": "NOME", "decimal": "," },
    "description": { "column": "NOME" }
  },
  "negativeIsExpense": true
}
```

---

## 14. Sistema Multi-Moeda

### 14.1 API

**Frankfurter API** (gratuita, baseada em BCE)
- Endpoint: `https://api.frankfurter.app/latest?from=EUR&to=USD`
- 150+ moedas
- Sem limites de requests
- Cache local para offline

### 14.2 Fluxo

1. User seleciona moeda da transação
2. Se diferente da moeda base → buscar taxa
3. Guardar `amount`, `currency`, `amountInBase`, `exchangeRate`
4. Dashboard sempre mostra em moeda base

---

## 15. Performance

### 15.1 Targets

| Métrica | Target |
|---------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.0s |
| Quick Add response | < 100ms |
| Lista 1000 items | < 500ms |
| Bundle JS | < 200KB gzip |

### 15.2 Estratégias

- Code splitting (Next.js automático)
- Virtual scrolling para listas grandes
- Memoização de componentes
- Índices IndexedDB otimizados
- Bulk operations para imports

---

## 16. Segurança e Privacidade

### 16.1 Princípios

1. **Dados locais por default** - IndexedDB no browser
2. **Zero conhecimento** - Não vemos dados financeiros
3. **Controlo do utilizador** - Export/delete a qualquer momento

### 16.2 Implementação

- Validação com Zod
- Sanitização de input
- CSP headers
- No tracking de valores (só eventos de uso)

---

## 17. Roadmap de Desenvolvimento

### Fase 1: MVP (Semanas 1-4)

| Semana | Tasks |
|--------|-------|
| 1 | Setup DB, schema, categorias default |
| 1 | Quick Add básico |
| 2 | Dashboard com resumo |
| 2 | Lista de transações |
| 3 | Editar/eliminar transações |
| 3 | Filtros por data e categoria |
| 4 | i18n (PT, EN) |
| 4 | Gráfico básico |

**Entregável:** App funcional para uso pessoal

### Fase 2: Core (Semanas 5-8)

| Semana | Tasks |
|--------|-------|
| 5 | Multi-moeda + Frankfurter |
| 5 | Settings page |
| 6 | Import CSV |
| 6 | Export JSON |
| 7 | Categorias custom |
| 7 | Orçamentos básicos |
| 8 | PT-BR locale |
| 8 | PWA manifest |

**Entregável:** Pronto para beta testers

### Fase 3: Sync & Premium (Semanas 9-12)

| Semana | Tasks |
|--------|-------|
| 9 | Supabase sync (push) |
| 9 | Supabase sync (pull) |
| 10 | Conflict resolution |
| 10 | Premium paywall |
| 11 | Ad banner (free tier) |
| 11 | Import assistido LLM |
| 12 | Family sharing |
| 12 | Polish |

**Entregável:** Lançamento público

---

## 18. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| IndexedDB storage limits | Baixa | Alertar user > 80%, oferecer export |
| Browser não suporta IndexedDB | Muito Baixa | Fallback localStorage, alert |
| Frankfurter API down | Baixa | Cache agressivo, última taxa |
| Conflitos sync complexos | Média | Last-write-wins + flag manual |
| Conversão PWYW baixa | Alta | Iterar pricing, value prop |

---

## Dependências Adicionais

```json
{
  "dependencies": {
    "papaparse": "^5.4.1",
    "xlsx": "^0.18.5",
    "recharts": "^2.12.0",
    "@tanstack/react-virtual": "^3.0.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "next-pwa": "^5.6.0"
  }
}
```

---

## Próximo Passo

Quando quiseres começar o desenvolvimento, diz:

> "Claude, inicia o desenvolvimento do ExpenseFlow conforme o PRD WebApp. Começa pela Fase 1, Semana 1: setup do schema Dexie.js e categorias default."

---

*PRD v2.0 - Web App para Breath of Now Ecosystem*
