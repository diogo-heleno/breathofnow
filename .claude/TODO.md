# TODO - Breath of Now

> Última atualização: 17 Dezembro 2024

Este ficheiro contém os próximos passos pendentes para o projeto. Claude Code deve ler este ficheiro no início de cada sessão.

---

## 🔴 Prioridade MÁXIMA

### ✅ ~~PWA Cache Management System~~ (CONCLUÍDO)

> ✅ Implementado em 17 Dezembro 2024

**Sistema implementado que permite ao utilizador ver e controlar conteúdo offline:**
- `src/lib/pwa/cache-config.ts` - Configuração de páginas com prioridades
- `src/lib/pwa/cache-manager.ts` - Lógica de gestão de cache
- `src/hooks/use-cache-status.ts` - Hook reactivo para estado do cache
- `src/components/pwa/offline-indicator.tsx` - Indicador no header
- `src/components/pwa/cache-status-panel.tsx` - Painel completo de gestão
- Service Worker actualizado com precaching e message handlers
- Traduções em 4 idiomas (en, pt, es, fr)

---

### 🔧 Adicionar OfflineIndicator à Homepage

- [ ] **Adicionar indicador de cache à homepage** (`www.breathofnow.site`)
  - O header e menu da homepage são diferentes do resto do site
  - Actualmente só aparece nas páginas de apps (expenses, etc.)
  - Componentes a alterar:
    - Header da landing page (verificar se é diferente de `header.tsx`)
    - Menu mobile da homepage
  - Garantir consistência visual com o resto do site

### 🔧 Melhorar nomes das páginas no Cache Panel

- [ ] **Mostrar títulos legíveis no painel de gestão de cache**
  - Actualmente mostra `nameKey` (chave i18n) em vez do título traduzido
  - Ficheiros a alterar:
    - `src/lib/pwa/cache-config.ts` - Adicionar títulos/descrições às páginas
    - `src/components/pwa/cache-status-panel.tsx` - Usar traduções ou títulos
  - Cada página deve mostrar nome amigável (ex: "Dashboard", "Transações", etc.)

### ✅ ~~BUG: Página fica em branco em modo offline~~ (CORRIGIDO)

> ✅ Corrigido em 17 Dezembro 2024

**Causa raiz:** Next.js App Router usa React Server Components (RSC) que fazem requests separados. Estes requests falhavam offline causando página em branco.

**Solução implementada em `public/sw.js` v4:**
- Handling específico para RSC requests (header RSC, Next-Router-State-Tree)
- Cache First strategy para `/_next/static/` (JS/CSS chunks)
- Retorna payload RSC vazio em vez de erro para prevenir crashes
- Cache de JS/CSS assets quando faz cache de páginas
- Fallback HTML inline para cenário offline sem React

---

### 🎯 PRÓXIMA TAREFA: Corrigir React Hooks Warnings

- [ ] **Corrigir warnings de React hooks** (dependencies)
  - `src/app/[locale]/expenses/add/page.tsx:78` - useEffect missing dependency
  - `src/app/[locale]/expenses/import/page.tsx:83,90` - useCallback missing dependency
  - `src/app/[locale]/expenses/page.tsx:119` - useMemo missing dependency

- [ ] **Implementar dashboard principal** (`/[locale]/dashboard`)
  - Página central com acesso a todas as apps
  - Cards de resumo por app
  - Quick actions

---

## Prioridade Média

- [ ] **Sistema de sync engine com Supabase**
  - Sync bidireccional Dexie ↔ Supabase
  - Conflict resolution (last-write-wins)
  - Sync status indicators
  - Background sync

- [ ] **Import de dados (JSON/CSV)**
  - Wizard de mapeamento de colunas
  - Preview antes de importar
  - Detecção de duplicados

- [ ] **Budgets/Orçamentos no ExpenseFlow**
  - Definir limites por categoria
  - Alertas de aproximação ao limite
  - Visualização de progresso

---

## Prioridade Baixa

- [ ] **InvestTrack completo**
  - CRUD de investimentos
  - Tracking de cotações
  - Gráficos de performance

- [ ] **RecipeBox app**
  - Gestão de receitas
  - Ingredientes e passos
  - Categorização

- [ ] **Integração Strava API** (StravaSync)
  - OAuth com Strava
  - Sync de atividades
  - Dashboard de métricas

---

## Concluído Recentemente

- [x] ~~PWA Cache Management System~~ (17 Dezembro 2024)
  - Cache status indicator no header
  - Painel de gestão com download/clear
  - Service Worker com precaching
  - Traduções em 4 idiomas
- [x] ~~Criar CRUD de ExpenseFlow~~ (Dezembro 2024)
- [x] ~~Dashboard de visualizações/gráficos ExpenseFlow~~ (Dezembro 2024)
- [x] ~~Export de dados JSON~~ (Dezembro 2024)
- [x] ~~Configurar RLS no Supabase ExpenseFlow~~ (Dezembro 2024)
- [x] ~~Configurar subdomínios www + app~~ (Dezembro 2024)
- [x] ~~Remover locale pt-BR~~ (16 Dezembro 2024)
- [x] ~~Redirecionar logo/Home para www.breathofnow.site~~ (16 Dezembro 2024)

---

## Notas para Próxima Sessão

- O projeto agora suporta **4 idiomas**: en, pt, es, fr
- Logo e Home no app shell redirecionam para `www.breathofnow.site`
- PWA Cache Management implementado - indicador no header + painel de gestão
- Lint tem warnings de React hooks que precisam ser corrigidos

### Bugs a Corrigir (Prioridade)
1. 🐛 **Página em branco offline** - Crítico para PWA
2. 🔧 **OfflineIndicator na homepage** - Header diferente
3. 🔧 **Nomes de páginas no cache panel** - UX

### Ficheiros Criados Hoje (17 Dez 2024)
- `src/lib/pwa/cache-config.ts`
- `src/lib/pwa/cache-manager.ts`
- `src/hooks/use-cache-status.ts`
- `src/components/pwa/offline-indicator.tsx`
- `src/components/pwa/cache-status-panel.tsx`

### Ficheiros Modificados Hoje
- `src/middleware.ts` (handle missing Supabase env)
- `src/components/shell/unified-app-header.tsx` (OfflineIndicator)
- `src/components/shell/app-shell.tsx` (OfflineIndicator)
- `src/components/layout/header.tsx` (OfflineIndicator)
- `public/sw.js` (precaching e message handlers)
- `messages/*.json` (traduções PWA)

### Próxima Tarefa Sugerida
1. Corrigir warnings de React hooks (lint)
2. Investigar bug de página em branco offline
3. Adicionar OfflineIndicator à homepage

---

> Actualizar este ficheiro no final de cada sessão de trabalho.
