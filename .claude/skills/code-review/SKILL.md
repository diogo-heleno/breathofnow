---
name: code-review
description: Comprehensive code review skill for Breath of Now. Use this skill when reviewing PRs, checking code quality, or validating implementations. Focuses on TypeScript best practices, performance, and project conventions.
---

# Code Review Skill

Este skill providencia capacidades de revisão de código compreensivas para o projecto Breath of Now. Verifica issues comuns, enforça convenções do projecto, e garante código de alta qualidade.

## Quando Usar

Aplica este skill quando:
- Rever pull requests
- Validar novas implementações
- Verificar bugs e issues
- Garantir qualidade antes de merge
- Fechar sessões de trabalho (CLOSE-PROMPT)

## Categorias de Revisão

### 1. Compliance TypeScript

```typescript
// ❌ EVITAR: any type
const data: any = response;
function handleClick(event: any) { }

// ✅ PREFERIR: Tipos explícitos
interface ApiResponse {
  data: Expense[];
  error: string | null;
}
const data: ApiResponse = response;

function handleClick(event: React.MouseEvent<HTMLButtonElement>) { }
```

```typescript
// ❌ EVITAR: Returns implícitos sem tipos
const getUser = (id) => users.find(u => u.id === id);

// ✅ PREFERIR: Tipos e returns explícitos
const getUser = (id: string): User | undefined => {
  return users.find(u => u.id === id);
};
```

### 2. Compliance i18n

```typescript
// ❌ REJEITAR: Texto hardcoded
<Button>Save Changes</Button>
<p className="error">Something went wrong</p>
<Input placeholder="Enter email" />

// ✅ ACEITAR: Texto traduzido
const t = useTranslations('Common');
<Button>{t('saveChanges')}</Button>
<p className="error">{t('errors.generic')}</p>
<Input placeholder={t('emailPlaceholder')} />
```

### 3. Arquitectura Local-First

```typescript
// ❌ REJEITAR: Leituras directas do Supabase para dados do utilizador
const expenses = await supabase.from('expenses').select('*');

// ✅ ACEITAR: Leituras de Dexie
const expenses = await db.expenses.toArray();
```

### 4. Issues de Performance

```typescript
// ❌ PROBLEMA: Async sequencial em loops
for (const item of items) {
  await processItem(item);  // Lento!
}

// ✅ MELHOR: Execução paralela
await Promise.all(items.map(item => processItem(item)));
```

```typescript
// ❌ PROBLEMA: Missing useMemo/useCallback
const filteredExpenses = expenses.filter(e => e.category === category);
const handleClick = () => doSomething(id);

// ✅ MELHOR: Memoizado
const filteredExpenses = useMemo(
  () => expenses.filter(e => e.category === category),
  [expenses, category]
);
const handleClick = useCallback(() => doSomething(id), [id]);
```

### 5. Error Handling

```typescript
// ❌ REJEITAR: Falhas silenciosas
try {
  await saveData();
} catch (e) {
  // Nada
}

// ✅ ACEITAR: Error handling adequado
try {
  await saveData();
} catch (error) {
  console.error('Failed to save:', error);
  toast.error(t('errors.saveFailed'));
}
```

### 6. Issues de Segurança

```typescript
// ❌ REJEITAR: Secrets expostos
const API_KEY = "sk-ant-xxxxx";
const SUPABASE_KEY = "eyJhbGc...";

// ✅ ACEITAR: Variáveis de ambiente
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
```

### 7. Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Ficheiros | kebab-case | `expense-chart.tsx` |
| Componentes | PascalCase | `ExpenseChart` |
| Funções | camelCase | `handleClick` |
| Constantes | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `UserPreferences` |
| DB Columns (Supabase) | snake_case | `apps_selected_at` |
| TS Properties | camelCase | `appsSelectedAt` |

## Checklist de Revisão

### Must Pass (Blocking) 🔴

- [ ] **Sem tipos `any`** (usar `unknown` se realmente desconhecido)
- [ ] **Sem texto hardcoded** em UI (usar traduções)
- [ ] **Sem leituras directas de Supabase** para dados do utilizador (usar Dexie)
- [ ] **Sem console.log** em código de produção
- [ ] **Sem secrets expostos** ou API keys
- [ ] **Error handling** em todas as operações async
- [ ] **Consultar `.claude/supabase-schema.md`** antes de queries

### Should Pass (Non-blocking) 🟡

- [ ] Interfaces TypeScript definidas adequadamente
- [ ] Componentes têm tamanho razoável (<300 linhas)
- [ ] Lógica complexa tem comentários
- [ ] Convenções de nomenclatura consistentes
- [ ] Estados de loading/error adequados em UI

### Nice to Have 🟢

- [ ] Unit tests para business logic
- [ ] Comentários JSDoc em funções exportadas
- [ ] Atributos de acessibilidade (aria-labels)
- [ ] Optimização de performance (memoização)

## Formato de Mensagem de Commit

```
tipo(scope): descrição curta (máx 50 chars)

Descrição mais detalhada do que foi feito e porquê.
Pode ter múltiplas linhas.

- Lista de mudanças principais
- Outra mudança
- Mais uma mudança

Files changed:
- path/to/file1.ts
- path/to/file2.tsx
```

**Tipos de commit:**
- `feat`: Nova funcionalidade
- `fix`: Correcção de bug
- `docs`: Mudanças em documentação
- `style`: Formatação, missing semi-colons, etc
- `refactor`: Refactoring de código
- `test`: Adicionar testes
- `chore`: Manutenção (deps, config, etc)

**Scopes comuns:**
- `expenses`: ExpenseFlow
- `fitlog`: FitLog
- `auth`: Autenticação
- `i18n`: Internacionalização
- `db`: Base de dados
- `ui`: Interface/Componentes
- `sync`: Sync engine

## Template de Resposta de Revisão

```markdown
## Code Review: [Nome da Feature/PR]

### ✅ Aprovado / ❌ Mudanças Necessárias / 🔄 Precisa Discussão

### Sumário
Breve visão geral do que o código faz.

### Issues Encontradas

#### 🔴 Crítico (Must Fix)
- Issue 1: Descrição e localização
- Issue 2: Descrição e localização

#### 🟡 Importante (Should Fix)
- Issue 1: Descrição e sugestão

#### 🟢 Menor (Nice to Fix)
- Issue 1: Sugestão de melhoria

### O Que Está Bom
- Feedback positivo sobre a implementação

### Sugestões
- Melhorias adicionais a considerar
```

## Verificações Automatizadas

Correr estes comandos para apanhar issues comuns:

```bash
# Erros TypeScript
npx tsc --noEmit

# Issues de linting
npm run lint

# Encontrar strings hardcoded (potenciais issues de i18n)
grep -r ">[A-Z][a-z]" --include="*.tsx" src/

# Encontrar console.log statements
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/

# Encontrar tipos 'any'
grep -rn ": any" --include="*.ts" --include="*.tsx" src/

# Verificar imports não utilizados
npx eslint --rule 'no-unused-vars: error' src/
```

## Matriz de Prioridade

| Tipo de Issue | Severidade | Acção |
|---------------|------------|-------|
| Vulnerabilidade de segurança | 🔴 Crítico | Bloquear merge |
| Texto hardcoded | 🔴 Crítico | Bloquear merge |
| Uso de tipo `any` | 🟡 Alto | Requerer mudança |
| Missing error handling | 🟡 Alto | Requerer mudança |
| Issue de performance | 🟡 Médio | Sugerir fix |
| Estilo de código | 🟢 Baixo | Fix opcional |

## Integração com CLOSE-PROMPT

Este skill é automaticamente invocado quando usas o CLOSE-PROMPT para:
- Verificar qualidade do código antes de commit
- Gerar mensagem de commit adequada
- Identificar issues não resolvidas
- Sugerir próximos passos

---

**Lembra-te**: Code review é sobre melhorar qualidade, não criticar o autor. Sê construtivo e útil.
