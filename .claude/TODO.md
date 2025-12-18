# TODO - Breath of Now

> Última atualização: 18 Dezembro 2024 (Sessão 2)

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

### ✅ ~~Melhorar nomes das páginas no Cache Panel~~ (CORRIGIDO)

> ✅ Corrigido em 18 Dezembro 2024

**Causa raiz:** Os `nameKey` em `cache-config.ts` tinham prefixo `pwa.` redundante (ex: `pwa.pages.home`), mas o componente já usava `useTranslations('pwa')`.

**Solução:** Removido prefixo `pwa.` de todos os nameKeys em `cache-config.ts`. Agora mostra nomes traduzidos correctamente (ex: "Home", "ExpenseFlow", "Transações", etc.) em todos os 4 idiomas.

### ✅ ~~BUG: Página fica em branco em modo offline~~ (CORRIGIDO)

> ✅ Corrigido em 18 Dezembro 2024 (v5 → v6 → v7)

**Causa raiz REAL:** Páginas com `'use client'` não geram HTML estático no build.
O SW tentava pre-cache de páginas que não existiam, falhando silenciosamente.

**Solução implementada em `public/sw.js` v7 (Runtime Cache Strategy):**
- STATIC_PAGES (server-rendered): Pre-cache no install
- CLIENT_PAGES (client-side): Runtime cache no primeiro visit
- Cache Warmup: Botão "Preparar para Offline" visita todas as páginas
- Aggressive runtime caching para ALL HTML responses
- `Response.redirect()` para RSC requests offline
- Localized offline HTML fallback (en/pt/es/fr)
- Low cache coverage warning UI (<30%)
- Progress bar durante warmup

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

- [x] ~~Migração para next-pwa com Workbox~~ (18 Dezembro 2024 - Sessão 2)
  - Substituído Service Worker manual por next-pwa
  - Configuração Workbox com runtime caching strategies
  - Página offline simplificada com traduções inline
  - Hook use-service-worker simplificado
  - Ficheiros gerados adicionados ao .gitignore
  - Fallback configurado para /en/offline
- [x] ~~Runtime Cache Strategy (v7)~~ (18 Dezembro 2024)
  - Service Worker v7 com runtime cache para client-side pages
  - STATIC_PAGES vs CLIENT_PAGES separation
  - Cache Warmup component com progress bar
  - Aggressive runtime caching no primeiro visit
  - Warmup translations em 4 idiomas
- [x] ~~Comprehensive offline system rewrite (v6)~~ (18 Dezembro 2024)
  - Service Worker v6 com install error handling (>50% threshold)
  - Response.redirect() para RSC offline (não 503)
  - Trailing slash URL matching
  - /offline em CRITICAL_PATHS
  - Retry logic (3 retries, exponential backoff)
  - Localized offline HTML (en/pt/es/fr)
  - Low cache coverage warning (<30%)
- [x] ~~Fix offline blank page bug~~ (18 Dezembro 2024)
  - Service Worker v5 com RSC handling
  - OfflineNavigationHandler força full-page nav
  - Error boundary para erros offline
- [x] ~~Nomes de páginas no Cache Panel~~ (18 Dezembro 2024)
  - Removido prefixo `pwa.` redundante dos nameKeys
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
- **PWA migrado para next-pwa** - Service Worker gerado automaticamente
- Lint tem warnings de React hooks que precisam ser corrigidos (pré-existentes)

### Bugs a Corrigir (Prioridade)
1. ✅ ~~Página em branco offline~~ - Corrigido com next-pwa
2. 🔧 **OfflineIndicator na homepage** - Header diferente
3. 🔄 **Testar offline após deploy** - Verificar que next-pwa funciona

### Ficheiros Modificados (18 Dez 2024 - Sessão 2)
- `package.json` - Adicionado next-pwa
- `next.config.mjs` - Configuração PWA com Workbox
- `public/sw.js` - **REMOVIDO** (agora gerado por next-pwa)
- `.gitignore` - Padrões para ficheiros PWA gerados
- `public/manifest.json` - Adicionado prefer_related_applications
- `src/app/[locale]/offline/page.tsx` - Simplificado com traduções inline
- `src/hooks/use-service-worker.ts` - Simplificado (registo automático)

### Próxima Tarefa Sugerida
1. Testar offline após deploy com nova configuração next-pwa
2. Corrigir warnings de React hooks (lint)
3. Adicionar OfflineIndicator à homepage (layout diferente)
4. Implementar dashboard principal

---

> Actualizar este ficheiro no final de cada sessão de trabalho.
