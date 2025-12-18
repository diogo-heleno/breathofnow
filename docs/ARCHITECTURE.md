# Breath of Now — Arquitetura da Plataforma

> Última atualização: Dezembro 2024

## Visão Geral

**Breath of Now** é uma plataforma-ecossistema privacy-first e offline-first que funciona como contentor para micro-aplicações de vida consciente.

> Uma infraestrutura única onde qualquer app pode ser adicionada sem reescrever autenticação, storage, sync, ou UI base.

---

## Stack Tecnológica

```
Next.js 14 (App Router)
├── Supabase (auth + database + storage)
├── Dexie.js (IndexedDB para local-first)
├── next-intl (i18n)
├── Tailwind CSS
├── Zustand (state management)
└── Vercel (hosting)
```

---

## Pilares Fundamentais

### 1. Offline-First Como Princípio

**O que significa na prática:**
- O browser é a fonte de verdade — a app funciona 100% sem internet
- Cloud é opcional — sync existe apenas para backup/multi-device
- Dados nunca se perdem — mesmo sem conta, dados persistem localmente

**Implementação:**
- Dexie.js como storage primário (wrapper sobre IndexedDB)
- Operações acontecem primeiro localmente
- Sync é assíncrono e invisível ao utilizador
- Conflitos resolvem-se com last-write-wins

### 2. Plataforma vs Apps — Separação Clara

**A plataforma fornece:**
- Shell unificado (header, navegação, footer, theming)
- Sistema de autenticação (Supabase Auth)
- Sistema de tiers (Free vs. Pro)
- Motor de storage (abstração Dexie + Supabase)
- Internacionalização (next-intl)
- PWA infrastructure
- Design system

**As apps recebem:**
- Acesso ao storage através de API consistente
- Contexto de utilizador (autenticado? tier? preferências?)
- Slot no UI para renderizar conteúdo
- Traduções próprias integradas no sistema global

### 3. Modelo de Dados

Cada app tem o seu próprio namespace no storage local:

```
BreathOfNowDB/
├── preferences/           # Preferências do utilizador
├── expenses/              # ExpenseFlow
│   ├── transactions
│   ├── categories
│   └── budgets
├── investments/           # InvestTrack
├── workouts/              # FitLog
├── recipes/               # RecipeBox
└── syncQueue/             # Fila de sync pendente
```

---

## Sistema de Tiers

Simplificado para dois níveis:

| | Free | Pro |
|---|---|---|
| **Preço** | €0 | €4.99/mês |
| **Apps** | 2 apps | Todas as apps |
| **Storage local** | ✅ Ilimitado | ✅ Ilimitado |
| **Cloud sync** | ❌ | ✅ |
| **Multi-device** | ❌ | ✅ |
| **Ads** | Sim | Não |

**Regra simples:** Free funciona 100% offline. Pro adiciona sync e remove ads.

---

## Internacionalização

**Idiomas suportados:**
- 🇬🇧 English (en) — default/fallback
- 🇵🇹 Português (pt)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)

**Implementação:**
- Traduções em ficheiros JSON (`/messages/*.json`)
- next-intl para gestão
- Fallback automático para inglês

---

## Estrutura do Projeto

```
breath-of-now/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx           # Shell principal
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── pricing/
│   │   │   ├── auth/
│   │   │   ├── account/
│   │   │   └── (apps)/              # Grupo de apps
│   │   │       ├── expenses/
│   │   │       ├── fitlog/
│   │   │       └── investments/
│   │   └── api/
│   ├── components/
│   │   ├── shell/                   # App shell
│   │   ├── ui/                      # Design system
│   │   ├── layout/                  # Header, Footer
│   │   └── [app]/                   # App-specific
│   ├── lib/
│   │   ├── storage/                 # Storage API unificada
│   │   │   └── index.ts
│   │   ├── subscription/            # Gestão de tiers
│   │   │   └── index.ts
│   │   ├── db/                      # Dexie schemas
│   │   ├── supabase/                # Supabase client
│   │   ├── sync/                    # Sync engine
│   │   └── pwa/                     # PWA utilities
│   ├── hooks/
│   │   ├── use-subscription.ts
│   │   ├── use-sync.ts
│   │   └── index.ts
│   ├── stores/                      # Zustand stores
│   └── types/
│       ├── common.ts
│       └── index.ts
├── messages/
│   ├── en.json
│   ├── pt.json
│   ├── es.json
│   └── fr.json
├── public/
│   ├── manifest.json
│   └── icons/
└── middleware.ts                    # i18n + auth routing
```

---

## Storage API

Interface unificada para todas as apps:

```typescript
// lib/storage/index.ts

interface StorageAPI {
  // Operações básicas
  get<T>(namespace: string, key: string): Promise<T | null>;
  set<T>(namespace: string, key: string, value: T): Promise<void>;
  delete(namespace: string, key: string): Promise<void>;
  
  // Queries
  getAll<T>(namespace: string): Promise<T[]>;
  query<T>(namespace: string, filter: FilterFn<T>): Promise<T[]>;
  
  // Bulk
  bulkSet<T>(namespace: string, items: Record<string, T>): Promise<void>;
  clear(namespace: string): Promise<void>;
}

// Uso numa app
import { storage, NAMESPACES } from '@/lib/storage';

// Guardar transação (vai para IndexedDB)
await storage.set(NAMESPACES.EXPENSES, 'tx_123', {
  id: 'tx_123',
  amount: 50,
  category: 'food',
  date: '2024-12-18'
});

// Obter todas as transações
const transactions = await storage.getAll(NAMESPACES.EXPENSES);
```

---

## Sync Engine

**Princípio:** Last-write-wins com timestamps.

```typescript
interface SyncableItem {
  id: string;
  updatedAt: number;      // timestamp
  deletedAt?: number;     // soft delete
  syncedAt?: number;      // última sync
}

// Fluxo de sync
// 1. Operação local → guarda em IndexedDB + adiciona à sync queue
// 2. Quando há rede → processa queue
// 3. Para cada item: compara timestamps, ganha o mais recente
// 4. Atualiza local ou remoto conforme necessário
```

**Quando faz sync:**
- Ao abrir a app (se online e Pro)
- Após cada operação (debounced, 5 segundos)
- Manualmente (pull-to-refresh)

**Indicador visual:**
- ✓ synced
- ↻ syncing
- ⚠ offline

---

## Auth Flow

```
Utilizador visita breathofnow.site
         │
    ┌────┴────┐
    ▼         ▼
 Sem conta   Com conta
 (anónimo)   (login)
    │         │
    ▼         ▼
 Usa apps    Supabase Auth
 100% local  verifica tier
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

## Apps Disponíveis

| App | Status | Descrição |
|-----|--------|-----------|
| **ExpenseFlow** | ✅ Disponível | Gestão de despesas |
| **FitLog** | ✅ Disponível | Tracking de treinos |
| **InvestTrack** | 🧪 Beta | Tracking de investimentos |
| **StravaSync** | 🔜 Em breve | Integração Strava |
| **RecipeBox** | 🔜 Em breve | Gestão de receitas |
| **LabelScan** | 🔜 Em breve | Scanner de rótulos |

---

## Checklist de Validação

**Offline-First:**
- [x] App abre instantaneamente sem rede
- [x] Todas as operações funcionam offline
- [x] Dados persistem após fechar browser
- [x] Sync acontece automaticamente quando volta online (Pro)

**Auth & Tiers:**
- [x] Utilizador anónimo consegue usar apps (local only)
- [x] Login/logout funcionam
- [x] Free user vê limite de apps
- [x] Pro user tem acesso a tudo + sync

**Apps:**
- [x] Adicionar nova app requer apenas: route + componentes + traduções
- [x] Apps não conhecem detalhes de storage/auth
- [x] Dados de uma app não afetam outra

**i18n:**
- [x] Troca de idioma é instantânea
- [x] Fallback para inglês funciona
- [x] Formatação de datas/números respeita locale

**PWA:**
- [x] Instalável no mobile
- [x] Funciona offline após primeira visita
- [x] Atualiza automaticamente

---

## Decisões Adiadas

| Decisão | Trigger para Decidir |
|---------|---------------------|
| CMS dedicado | Quando tiveres editores não-técnicos |
| Mais idiomas | Quando tiveres utilizadores que peçam |
| App nativa | Quando PWA não for suficiente |
| Sync mais sofisticado | Quando last-write-wins causar problemas |
| Analytics avançado | Quando precisares de métricas detalhadas |

---

## Resumo

Esta arquitetura mantém os princípios core:
- **Offline-first** com Dexie.js
- **Privacy-first** com dados locais por defeito
- **Modular** com apps como routes independentes
- **Dois tiers** simples (Free/Pro)

O resultado é um projeto sustentável, escalável, e focado na experiência do utilizador.
