# Regras de Desenvolvimento - Breath of Now

> ⚠️ REGRAS OBRIGATÓRIAS - Claude Code DEVE seguir estas regras em TODAS as tarefas.

---

## 📖 Leitura Obrigatória

Antes de iniciar QUALQUER tarefa, Claude Code DEVE:

1. Ler `.claude/RULES.md` (este ficheiro) para regras obrigatórias
2. Ler `.claude/PROJECT.md` para contexto completo do projeto
3. Ler `CLAUDE.md` para instruções técnicas específicas

---

## 🌍 Regra #1: Internacionalização (i18n) OBRIGATÓRIA

### NUNCA usar texto hardcoded

Todo o texto visível ao utilizador DEVE usar o sistema de traduções `next-intl`:

```tsx
// ❌ PROIBIDO - Texto hardcoded
<h1>Welcome to our app</h1>
<button>Save</button>
<p className="error">Something went wrong</p>
<span>Back</span>

// ✅ CORRETO - Usar traduções
import { useTranslations } from 'next-intl';

const t = useTranslations('namespace');
<h1>{t('welcome')}</h1>
<button>{t('actions.save')}</button>
<p className="error">{t('errors.generic')}</p>
<span>{t('navigation.back')}</span>
```

### Exceções permitidas (NÃO precisam de i18n):

- **Nomes de marca**: "BreathofNow", "ExpenseFlow", "InvestTrack", "FitLog"
- **Símbolos**: €, $, %, +, -, etc.
- **Números e datas**: Usar formatadores i18n (`formatNumber`, `formatDate`)
- **Código técnico**: Variáveis, classes CSS, IDs
- **aria-label técnicos**: Quando são identificadores, não texto para utilizador

### Idiomas suportados (TODOS devem ser atualizados):

- 🇬🇧 `en.json` - English
- 🇵🇹 `pt.json` - Português
- 🇪🇸 `es.json` - Español
- 🇫🇷 `fr.json` - Français

### Verificação antes de commit:

```bash
# Procurar texto hardcoded em componentes
grep -rn --include="*.tsx" ">[A-Z][a-zA-Z ]\{3,\}<" src/

# Procurar strings longas hardcoded
grep -rn --include="*.tsx" '"[A-Z][a-zA-Z ]\{10,\}"' src/
```

### Checklist i18n:

- [ ] Zero texto hardcoded em componentes/páginas
- [ ] Todas as strings novas adicionadas a `messages/*.json`
- [ ] TODOS os 4 ficheiros de idioma atualizados
- [ ] Namespace apropriado usado (ex: `expenses.`, `fitlog.`, `common.`)

---

## 📝 Regra #2: Atualização de Documentação

Quando Claude Code fizer alterações significativas ao projeto:

### Processo obrigatório:

1. **IDENTIFICAR** se a alteração requer atualização de documentação
2. **PERGUNTAR** antes de modificar `.claude/PROJECT.md`
3. **MOSTRAR** exatamente o que será adicionado/modificado
4. **AGUARDAR** confirmação explícita ("OK") do utilizador
5. **SÓ ENTÃO** fazer a alteração

### Formato de proposta:

```
📝 PROPOSTA DE ATUALIZAÇÃO - PROJECT.md

Secção: [nome da secção]
Tipo: [Adição | Modificação | Remoção]
Razão: [porque esta atualização é necessária]

Conteúdo proposto:
---
[conteúdo markdown formatado]
---

Confirmas esta alteração? (OK/Não)
```

### Alterações que requerem atualização de documentação:

- Novas páginas ou rotas
- Novos componentes principais
- Alterações ao schema de base de dados
- Novas funcionalidades implementadas
- Alterações à arquitetura
- Novos packages/dependências importantes

### NUNCA atualizar documentação sem aprovação explícita!

---

## 🔧 Regra #3: Convenções de Código

### TypeScript

- **Strict mode** sempre ativo
- **NUNCA** usar tipo `any` - usar tipos específicos ou `unknown`
- Interfaces para objetos, types para unions
- Componentes funcionais com hooks

### Styling

- **APENAS** Tailwind CSS - NUNCA inline styles
- Usar `cn()` utility para class merging (clsx + tailwind-merge)
- Seguir design tokens definidos em `tailwind.config.ts`

### Imports

```tsx
// Usar path aliases
import { Button } from '@/components/ui';
import { db } from '@/lib/db';
import { useExpenseStore } from '@/stores/expense-store';

// NUNCA usar paths relativos longos
import { Button } from '../../../components/ui/button'; // ❌
```

### Commits

Seguir Conventional Commits:

```
feat(expenses): add recurring transaction support
fix(sync): resolve conflict in offline merge
docs(readme): update installation steps
chore(deps): update dependencies
refactor(auth): simplify login flow
style(ui): adjust button padding
test(expenses): add unit tests for calculations
```

---

## 📁 Regra #4: Estrutura de Ficheiros

### Localizações obrigatórias:

| Tipo | Localização |
|------|-------------|
| Páginas | `src/app/[locale]/` |
| Componentes UI | `src/components/ui/` |
| Componentes de App | `src/components/[app-name]/` |
| Layout components | `src/components/layout/` |
| Stores (Zustand) | `src/stores/` |
| Lib/Utils | `src/lib/` |
| Tipos | `src/types/` |
| Traduções | `messages/` |
| Documentação | `docs/` ou `.claude/` |
| Assets públicos | `public/` |

### Regras de nomenclatura:

- **Ficheiros**: kebab-case (`expense-pie-chart.tsx`)
- **Componentes**: PascalCase (`ExpensePieChart`)
- **Funções/variáveis**: camelCase (`handleClick`, `isLoading`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_ITEMS`, `API_URL`)
- **Tabelas DB**: snake_case plural (`expense_transactions`)
- **Colunas DB**: snake_case (`created_at`, `user_id`)

---

## ✅ Regra #5: Checklist de Verificação

Antes de considerar uma tarefa completa, verificar:

### Código

- [ ] TypeScript sem erros: `npx tsc --noEmit`
- [ ] Lint passa: `npm run lint`
- [ ] Build funciona: `npm run build`
- [ ] Sem `console.log` em código de produção

### i18n

- [ ] Zero texto hardcoded
- [ ] Todos os 4 idiomas atualizados
- [ ] Namespaces consistentes

### Documentação

- [ ] `.claude/PROJECT.md` atualizado (se necessário, com aprovação)
- [ ] Comentários de código onde necessário
- [ ] README atualizado para novas funcionalidades major

### Git

- [ ] Ficheiros corretos staged
- [ ] Commit message segue Conventional Commits
- [ ] Sem ficheiros sensíveis (.env, secrets)

---

## 🚨 Violações Críticas

As seguintes ações são **PROIBIDAS**:

1. ❌ Commitar texto hardcoded em UI
2. ❌ Usar tipo `any` em TypeScript
3. ❌ Atualizar PROJECT.md sem aprovação
4. ❌ Commitar ficheiros .env ou secrets
5. ❌ Criar páginas fora de `[locale]/`
6. ❌ Usar inline styles em vez de Tailwind
7. ❌ Ignorar erros de TypeScript ou ESLint

---

> Última atualização: Dezembro 2024
