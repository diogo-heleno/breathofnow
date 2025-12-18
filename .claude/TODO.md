# TODO - Breath of Now

> Última atualização: 18 Dezembro 2024 (Arquitetura v4)

Este ficheiro contém os próximos passos pendentes para o projeto. Claude Code deve ler este ficheiro no início de cada sessão.

---

## 🔴 Prioridade MÁXIMA

### ✅ Arquitetura v4 - Simplificação (CONCLUÍDO)

> ✅ Implementado em 18 Dezembro 2024

**Novos módulos criados:**
- `src/lib/storage/index.ts` - Storage API unificada
- `src/lib/subscription/index.ts` - Gestão de tiers (Free vs Pro)
- `src/hooks/use-subscription.ts` - Hook de subscription
- `src/types/common.ts` - Tipos comuns partilhados
- `docs/ARCHITECTURE.md` - Documento de arquitetura

**Ficheiros atualizados:**
- `CLAUDE.md` - Instruções atualizadas
- `.claude/PROJECT.md` - Documentação do projeto
- `.claude/RULES.md` - Novas regras (Storage API, Subscription hooks)
- `src/hooks/index.ts` - Exports de hooks
- `src/types/index.ts` - Exports de tipos

---

### 🎯 PRÓXIMA TAREFA: Migrar código existente para Storage API

- [ ] **Atualizar ExpenseFlow** para usar Storage API
  - Substituir chamadas diretas ao Dexie por `storage.get/set/getAll`
  - Testar que tudo continua a funcionar
  
- [ ] **Atualizar FitLog** para usar Storage API
  - Mesmo processo

- [ ] **Implementar seleção de apps** para tier Free
  - Interface para escolher 2 apps
  - Persistir escolha em localStorage + Supabase (se autenticado)
  - Verificar acesso em cada app com `checkAppAccess()`

---

## 🟡 Prioridade Alta

### Corrigir React Hooks Warnings

- [ ] `src/app/[locale]/expenses/add/page.tsx:78` - useEffect missing dependency
- [ ] `src/app/[locale]/expenses/import/page.tsx:83,90` - useCallback missing dependency
- [ ] `src/app/[locale]/expenses/page.tsx:119` - useMemo missing dependency

### Implementar Dashboard Principal

- [ ] **Criar `/[locale]/dashboard`**
  - Cards de resumo por app
  - Acesso rápido às apps selecionadas
  - Status de sync (para Pro)

### Adicionar OfflineIndicator à Homepage

- [ ] O header da landing page é diferente
- [ ] Garantir consistência visual

---

## 🟢 Prioridade Média

### Sistema de Sync Engine

- [ ] Completar sync bidireccional Dexie ↔ Supabase
- [ ] Conflict resolution (last-write-wins)
- [ ] Sync status indicators no header
- [ ] Background sync

### Import de Dados

- [ ] Wizard de mapeamento de colunas
- [ ] Preview antes de importar
- [ ] Detecção de duplicados

### Budgets no ExpenseFlow

- [ ] Definir limites por categoria
- [ ] Alertas de aproximação ao limite
- [ ] Visualização de progresso

---

## 🔵 Prioridade Baixa

- [ ] **InvestTrack completo** - CRUD, cotações, gráficos
- [ ] **RecipeBox app** - Gestão de receitas
- [ ] **Integração Strava** - OAuth, sync atividades

---

## ✅ Concluído Recentemente

- [x] ~~Arquitetura v4 - Storage API, Subscription, tipos~~ (18 Dezembro 2024)
- [x] ~~Migração para next-pwa com Workbox~~ (18 Dezembro 2024)
- [x] ~~Runtime Cache Strategy (v7)~~ (18 Dezembro 2024)
- [x] ~~PWA Cache Management System~~ (17 Dezembro 2024)
- [x] ~~ExpenseFlow MVP completo~~ (Dezembro 2024)
- [x] ~~FitLog funcional~~ (Dezembro 2024)

---

## Notas para Próxima Sessão

### Arquitetura v4 (Novos Módulos)

```typescript
// Storage API
import { storage, NAMESPACES } from '@/lib/storage';
await storage.set(NAMESPACES.EXPENSES, key, data);

// Subscription Hook
import { useSubscription } from '@/hooks';
const { tier, isPro, checkAppAccess } = useSubscription();

// Tipos
import type { AppId, User } from '@/types';
```

### Regras Importantes

1. **USAR Storage API** em vez de Dexie direto
2. **USAR hooks de subscription** para verificações de tier
3. **IMPORTAR tipos** de `@/types` quando disponíveis

### Ficheiros Novos/Modificados (18 Dez 2024)

**Novos:**
- `src/lib/storage/index.ts`
- `src/lib/subscription/index.ts`
- `src/hooks/use-subscription.ts`
- `src/types/common.ts`
- `docs/ARCHITECTURE.md`

**Atualizados:**
- `CLAUDE.md`
- `.claude/PROJECT.md`
- `.claude/RULES.md`
- `.claude/TODO.md`
- `src/hooks/index.ts`
- `src/types/index.ts`

---

> Atualizar este ficheiro no final de cada sessão de trabalho.
