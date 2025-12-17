# TODO - Breath of Now

> Última atualização: 17 Dezembro 2024

Este ficheiro contém os próximos passos pendentes para o projeto. Claude Code deve ler este ficheiro no início de cada sessão.

---

## 🔴 Prioridade MÁXIMA

### 🎯 PWA Cache Management System

> 📄 **Documentação completa:** `.claude/docs/pwa-cache-management.md`

**Objetivo:** Implementar sistema que permite ao utilizador ver e controlar que conteúdo está disponível offline.

#### Funcionalidades a Implementar

1. **Cache Status Indicator** (Header/Settings)
   - Mostrar percentagem de conteúdo cached: "75% disponível offline"
   - Ícone clicável que abre painel de detalhes
   - Atualizar em tempo real quando cache muda

2. **Cache Details Panel/Page** (`/[locale]/settings/offline` ou modal)
   - Lista de páginas com estado de cache:
     - ✅ Cached (com tamanho aproximado)
     - ⬜ Não cached (com botão "Descarregar")
   - Agrupamento por categoria:
     - **Core** (sempre cached): App Shell, Dashboard
     - **Apps**: ExpenseFlow, FitLog, etc.
     - **Páginas Estáticas**: FAQ, Terms, Privacy
   - Botões de ação:
     - "Descarregar Tudo"
     - "Limpar Cache"
     - "Atualizar Cache"

3. **Precaching Inteligente**
   - **Automático na instalação:** App shell + assets críticos
   - **Prioritário:** Dashboard, ExpenseFlow (se selecionado)
   - **On-demand:** Páginas secundárias quando utilizador clica

4. **Service Worker Enhancements**
   - Implementar precache manifest com lista de URLs
   - API para verificar estado do cache (`caches.has()`, `caches.keys()`)
   - Comunicação SW ↔ React via `postMessage`
   - Background sync para downloads

#### Estrutura Técnica

```
src/
├── lib/
│   └── pwa/
│       ├── cache-manager.ts      # Lógica de gestão de cache
│       ├── precache-manifest.ts  # Lista de URLs para precache
│       └── sw-communication.ts   # postMessage helpers
├── hooks/
│   └── use-cache-status.ts       # Hook para estado do cache
├── components/
│   └── pwa/
│       ├── cache-indicator.tsx   # Indicador no header
│       ├── cache-panel.tsx       # Painel de detalhes
│       └── cache-progress.tsx    # Barra de progresso
└── app/[locale]/
    └── settings/
        └── offline/
            └── page.tsx          # Página dedicada (opcional)
```

#### Páginas a Incluir no Precache

| Prioridade | Páginas | Quando Cachear |
|------------|---------|----------------|
| **1 - Crítico** | App Shell, `/dashboard` | Instalação |
| **2 - Apps Core** | `/expenses/*`, `/fitlog/*` | Instalação (se selecionadas) |
| **3 - Estáticas** | `/faq`, `/terms`, `/privacy` | On-demand |
| **4 - Outras** | `/pricing`, `/features/*` | On-demand |

#### UI Mockup (Cache Panel)

```
┌─────────────────────────────────────────┐
│  📱 Conteúdo Offline                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ████████████░░░░ 75% disponível        │
│                                         │
│  CORE (sempre disponível)               │
│  ✅ App Shell                    120KB  │
│  ✅ Dashboard                     45KB  │
│                                         │
│  APPS                                   │
│  ✅ ExpenseFlow (5 páginas)      180KB  │
│  ⬜ FitLog              [Descarregar]   │
│                                         │
│  PÁGINAS                                │
│  ✅ FAQ                           12KB  │
│  ⬜ Privacy             [Descarregar]   │
│  ⬜ Terms               [Descarregar]   │
│                                         │
│  [🔄 Atualizar]  [📥 Descarregar Tudo]  │
│                                         │
│  Último update: há 2 horas              │
│  Espaço usado: 357KB                    │
└─────────────────────────────────────────┘
```

#### Considerações i18n

Todas as strings devem usar traduções. Namespace sugerido: `pwa.cache`

```json
{
  "pwa": {
    "cache": {
      "title": "Offline Content",
      "available": "{percent}% available offline",
      "downloadAll": "Download All",
      "clearCache": "Clear Cache",
      "refresh": "Refresh",
      "cached": "Cached",
      "notCached": "Not cached",
      "download": "Download",
      "lastUpdate": "Last update: {time}",
      "spaceUsed": "Space used: {size}",
      "categories": {
        "core": "Core (always available)",
        "apps": "Apps",
        "pages": "Pages"
      }
    }
  }
}
```

#### Dependências

- Verificar se `next-pwa` já está configurado
- Se não, instalar e configurar primeiro
- Pode precisar de `workbox-window` para comunicação com SW

#### Critérios de Aceitação

- [ ] Indicador de cache visível no header ou settings
- [ ] Painel mostra lista de páginas com estado
- [ ] Utilizador pode descarregar páginas individuais
- [ ] Utilizador pode descarregar tudo de uma vez
- [ ] Precache automático das páginas críticas na instalação
- [ ] Funciona 100% offline após cache
- [ ] Traduções em 4 idiomas (en, pt, es, fr)
- [ ] Sem texto hardcoded
- [ ] TypeScript sem erros

---

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
- Todos os testes TypeScript passam (`npx tsc --noEmit`)
- Lint tem apenas warnings pré-existentes (hooks dependencies)
- **PWA Cache Management** é a nova prioridade máxima

---

> Actualizar este ficheiro no final de cada sessão de trabalho.
