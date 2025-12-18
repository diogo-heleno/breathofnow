# Documento de Projeto - Breath of Now

> Última atualização: 18 Dezembro 2024 (Arquitetura v4 - Simplificação)

---

## 1. Visão Geral do Projeto

**Breath of Now** é uma plataforma-ecossistema privacy-first e offline-first de micro-apps para vida consciente, uma marca da **M21 Global, Lda**.

### Princípios Fundamentais

1. **Offline-First**: O browser é a fonte de verdade - a app funciona 100% sem internet
2. **Privacy-First**: Dados nunca saem do dispositivo sem consentimento explícito
3. **Platform vs Apps**: Infraestrutura única partilhada por todas as micro-apps

### Apps do Ecossistema

| App | Estado | Descrição |
|-----|--------|-----------|
| **ExpenseFlow** | ✅ Disponível | Gestão de despesas |
| **FitLog** | ✅ Disponível | Registo de fitness/treinos |
| **InvestTrack** | 🧪 Beta | Tracking de investimentos |
| **StravaSync** | 🔜 Em breve | Integração com Strava |
| **RecipeBox** | 🔜 Em breve | Gestão de receitas |
| **LabelScan** | 🔜 Em breve | Scanner de etiquetas/produtos |

---

## 2. Stack Tecnológico

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
| **PWA** | next-pwa (Workbox) | 5.6.0 |
| **Hosting** | Vercel | - |
| **Repositório** | GitHub | - |

---

## 3. Arquitetura Local-First

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
│         │  Storage API  │  (NEW - abstração)     │
│         └───────┬───────┘                        │
│                  │                               │
│         ┌───────┴───────┐                        │
│         │  Sync Engine  │  (Pro only)            │
│         └───────┬───────┘                        │
└─────────────────┼───────────────────────────────┘
                  │ (quando online + Pro)
                  ▼
         ┌───────────────┐
         │   Supabase    │
         │  (opcional)   │
         └───────────────┘
```

### Storage API (Nova Abstração)

Interface unificada para todas as apps em `src/lib/storage/`:

```typescript
import { storage, NAMESPACES } from '@/lib/storage';

// Guardar transação
await storage.set(NAMESPACES.EXPENSES, 'tx_123', data);

// Obter todas as transações
const transactions = await storage.getAll(NAMESPACES.EXPENSES);

// Query com filtro
const filtered = await storage.query(NAMESPACES.EXPENSES, 
  tx => tx.amount > 100
);
```

---

## 4. Estrutura de Pastas

```
breathofnow/
├── messages/                    # Ficheiros de tradução (4 idiomas)
│   ├── en.json
│   ├── pt.json
│   ├── es.json
│   └── fr.json
├── src/
│   ├── app/[locale]/            # Páginas localizadas (App Router)
│   │   ├── layout.tsx           # Layout raiz
│   │   ├── page.tsx             # Homepage
│   │   ├── pricing/             # Preços
│   │   ├── faq/                 # FAQ
│   │   ├── auth/                # Autenticação
│   │   ├── account/             # Conta/Seleção de apps
│   │   ├── expenses/            # ExpenseFlow
│   │   ├── fitlog/              # FitLog
│   │   └── offline/             # Página offline
│   ├── components/
│   │   ├── ui/                  # Design system
│   │   ├── layout/              # Header, Footer
│   │   ├── shell/               # App shell unificado
│   │   ├── pwa/                 # Componentes PWA
│   │   └── [app]/               # Componentes específicos de cada app
│   ├── lib/
│   │   ├── storage/             # NEW: Storage API unificada
│   │   │   └── index.ts
│   │   ├── subscription/        # NEW: Gestão de tiers
│   │   │   └── index.ts
│   │   ├── db/                  # Dexie database setup
│   │   ├── sync/                # Sync engine
│   │   ├── supabase/            # Cliente Supabase
│   │   ├── pwa/                 # Cache management
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── index.ts             # Exports
│   │   ├── use-subscription.ts  # NEW: Hook de subscription
│   │   ├── use-sync.ts
│   │   ├── use-premium.ts
│   │   ├── use-cache-status.ts
│   │   └── use-service-worker.ts
│   ├── stores/                  # Zustand stores
│   ├── types/
│   │   ├── index.ts             # Exports
│   │   ├── common.ts            # NEW: Tipos comuns
│   │   ├── pricing.ts
│   │   └── fitlog.ts
│   ├── i18n.ts
│   └── middleware.ts
├── docs/
│   ├── ARCHITECTURE.md          # NEW: Documento de arquitetura
│   └── supabase/                # Schemas SQL
├── .claude/                     # Documentação Claude Code
├── tailwind.config.ts
├── next.config.mjs
└── CLAUDE.md
```

---

## 5. Sistema de Tiers (Simplificado v4)

### Apenas 2 Tiers: Free vs Pro

| | Free | Pro |
|---|---|---|
| **Preço** | €0 | €4.99/mês |
| **Apps** | 2 apps à escolha | Todas as apps |
| **Storage local** | ✅ Ilimitado | ✅ Ilimitado |
| **Cloud sync** | ❌ | ✅ |
| **Multi-device** | ❌ | ✅ |
| **Ads** | Sim | Não |

**Regra simples:** Free funciona 100% offline. Pro adiciona sync e remove ads.

### Gestão de Subscription

```typescript
import { useSubscription } from '@/hooks';

const { 
  tier,           // 'free' | 'pro'
  isPro,          // boolean
  canSync,        // boolean
  showAds,        // boolean
  maxApps,        // number (2 para free, Infinity para pro)
  selectedApps,   // AppId[]
  checkAppAccess, // (appId) => boolean
} = useSubscription();
```

---

## 6. Internacionalização

### Idiomas Suportados

- 🇬🇧 English (en) - default/fallback
- 🇵🇹 Português (pt)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)

### Persistência de Locale

- Cookie `NEXT_LOCALE` persiste preferência
- Funciona cross-subdomain (www ↔ app) via `.breathofnow.site`

### Preços Regionais

| Tier | Países | Multiplicador |
|------|--------|---------------|
| **Alto** | US, GB, DE, FR, CH | 1.0x |
| **Médio** | PT, ES, IT | 0.6x |
| **Baixo** | BR, AO, MZ | 0.3x |

---

## 7. Schema da Base de Dados Local (Dexie)

### Namespaces

```
BreathOfNowDB/
├── preferences/           # Preferências do utilizador
├── expenseTransactions/   # ExpenseFlow - transações
├── expenseCategories/     # ExpenseFlow - categorias
├── expenseBudgets/        # ExpenseFlow - orçamentos
├── investments/           # InvestTrack
├── workouts/              # FitLog
├── recipes/               # RecipeBox
└── exchangeRates/         # Taxas de câmbio
```

### Tipos Base

```typescript
interface BaseEntity {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncableEntity extends BaseEntity {
  syncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deletedAt?: Date;  // soft delete
}
```

---

## 8. Autenticação

### Métodos Suportados

- ✅ Magic Link (OTP via email)
- ✅ OAuth Google
- ✅ OAuth GitHub

### Auth Flow

```
Utilizador visita breathofnow.site
         │
    ┌────┴────┐
    ▼         ▼
 Sem conta   Com conta
 (anónimo)   (login)
    │         │
    ▼         ▼
 Usa apps    Verifica tier
 100% local  (Free/Pro)
    │         │
    │    ┌────┴────┐
    │    ▼         ▼
    │  Free      Pro
    │  2 apps    Todas apps
    │  local     + sync
    │    │         │
    └────┴─────────┘
              │
              ▼
    Dados sempre em IndexedDB
    (sync adicional se Pro)
```

---

## 9. Design System

### Paleta de Cores

- **Primary** (Warm Sage Green): `#5a7d5a`
- **Secondary** (Warm Sand): `#b19373`
- **Accent** (Soft Terracotta): `#df7459`
- **Neutrals**: Escala 50-950 de cinzas quentes

### Tipografia

- **Display**: Fraunces (serif)
- **Body**: Source Sans 3 (sans-serif)
- **Mono**: JetBrains Mono

### Componentes UI

| Componente | Localização |
|------------|-------------|
| Button | `@/components/ui/button` |
| Input | `@/components/ui/input` |
| Card | `@/components/ui/card` |
| Badge | `@/components/ui/badge` |

---

## 10. Sync Engine

### Princípio: Last-Write-Wins

```typescript
interface SyncableItem {
  id: string;
  updatedAt: number;      // timestamp
  deletedAt?: number;     // soft delete
  syncedAt?: number;      // última sync
}
```

### Quando Faz Sync

- Ao abrir a app (se online e Pro)
- Após cada operação (debounced, 5 segundos)
- Manualmente (pull-to-refresh)

### Indicador Visual

- ✓ synced
- ↻ syncing
- ⚠ offline

---

## 11. PWA

### Funcionalidades

- ✅ next-pwa com Workbox
- ✅ Runtime caching configurável
- ✅ Fallback para página offline
- ✅ Hook `use-service-worker`
- ✅ Indicadores de cache

### Estratégias de Cache

| Recurso | Estratégia |
|---------|------------|
| Páginas | NetworkFirst |
| Static assets | CacheFirst |
| Imagens | CacheFirst |
| API calls | NetworkFirst |

---

## 12. Domínios

| Domínio | Propósito |
|---------|-----------|
| **www.breathofnow.site** | Website/Landing |
| **app.breathofnow.site** | Aplicações |
| **API** | Supabase (managed) |

---

## 13. Próximos Passos

### Concluído ✅

- [x] ExpenseFlow MVP completo
- [x] FitLog funcional
- [x] PWA com next-pwa
- [x] Storage API unificada
- [x] Sistema de tiers simplificado
- [x] Documentação de arquitetura v4

### Em Progresso 🔄

- [ ] Implementar sync engine completo
- [ ] Seleção de apps para tier Free
- [ ] Dashboard principal

### Futuro 🔜

- [ ] InvestTrack completo
- [ ] RecipeBox
- [ ] Integração Strava

---

## 14. Referências

| Documento | Descrição |
|-----------|-----------|
| `CLAUDE.md` | Instruções para Claude Code |
| `.claude/RULES.md` | Regras obrigatórias |
| `docs/ARCHITECTURE.md` | Arquitetura detalhada |
| `.claude/supabase-schema.md` | Schema Supabase |

---

> Este documento reflete o estado atual do projeto após a simplificação v4.
