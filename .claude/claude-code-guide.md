# Guia: Usar Documentação Supabase com Claude Code

## 🎯 Objetivo

Este guia explica como manter e usar a documentação do schema do Supabase para evitar erros de nomes de colunas/tabelas.

---

## 📁 Estrutura de Ficheiros

```
breathofnow/
├── .claude/
│   ├── supabase-schema.md       ← Schema completo da DB
│   └── claude-code-guide.md     ← Este ficheiro
├── supabase/
│   └── migrations/
│       └── 20241210_001_auth_profiles.sql  ← Migração actual
```

---

## ✅ Boas Práticas

### 1. Sempre Consultar o Schema Antes de Escrever Código

**ERRADO:**
```typescript
// Assumir que a coluna se chama "last_app_change"
const { data } = await supabase
  .from('profiles')
  .select('last_app_change')  // ❌ Esta coluna não existe!
```

**CORRETO:**
```typescript
// Consultar .claude/supabase-schema.md primeiro
// Descobrir que a coluna é "apps_selected_at"
const { data } = await supabase
  .from('profiles')
  .select('apps_selected_at')  // ✅ Nome correto!
```

### 2. Prompt para Claude Code

Quando pedires ao Claude Code para trabalhar com Supabase, inclui sempre:

```
📝 PROMPT EXEMPLO:

"Precisas de atualizar a query para ir buscar a data da última seleção de apps.

ANTES de escreveres código:
1. Lê o ficheiro .claude/supabase-schema.md
2. Verifica qual é o nome EXATO da coluna
3. Verifica o tipo de dados
4. Só depois escreve o código"
```

### 3. Nomes de Colunas Comuns (Quick Reference)

| ❌ Nome Errado | ✅ Nome Correto | Tabela |
|---------------|----------------|--------|
| `last_app_change` | `apps_selected_at` | profiles |
| `subscriptionTier` | `subscription_tier` | profiles |
| `isFoundingMember` | `is_founding_member` | profiles |
| `fullName` | `full_name` | profiles |
| `avatarUrl` | `avatar_url` | profiles |
| `selectedApps` | `selected_apps` | profiles |
| `createdAt` | `created_at` | todas |
| `updatedAt` | `updated_at` | todas |

**REGRA:** Supabase usa **snake_case**, TypeScript usa **camelCase**.

---

## 🔄 Workflow de Desenvolvimento

### Quando Fazeres Mudanças no Supabase

1. **Actualizar via Dashboard:**
   ```
   Supabase Dashboard → SQL Editor → Corre ALTER TABLE
   ```

2. **Documentar a mudança:**
   - Abre `.claude/supabase-schema.md`
   - Adiciona a nova coluna/tabela
   - Actualiza a tabela de colunas
   - Guarda o ficheiro

3. **Criar migração:**
   ```sql
   -- Criar novo ficheiro em supabase/migrations/
   -- Nome: YYYYMMDD_NNN_descricao.sql
   -- Exemplo: 20241212_002_add_apps_selected_at.sql
   ```

4. **Commit no GitHub:**
   ```
   - Mudanças no schema
   - Documentação actualizada
   - Nova migração
   ```

### Quando Detectares um Erro

**Exemplo Real:** Claude Code tentou usar `last_app_change` mas a coluna é `apps_selected_at`.

1. **Identificar o problema:**
   ```typescript
   // Código que falhou:
   const { apps_selected_at: lastChange } = profile;
   // Erro: column "last_app_change" does not exist
   ```

2. **Consultar documentação:**
   ```bash
   cat .claude/supabase-schema.md | grep "apps"
   # Encontra: apps_selected_at TIMESTAMPTZ
   ```

3. **Corrigir o código:**
   ```typescript
   // Correcção:
   const { apps_selected_at: lastChange } = profile;
   ```

4. **Actualizar documentação se necessário:**
   - Adicionar nota na secção "Notas Importantes"
   - Adicionar à tabela de "Nomes Comuns"

---

## 🧪 Scripts de Verificação

### Verificar se o Código Usa Nomes Correctos

```bash
#!/bin/bash
# check-db-columns.sh

echo "🔍 A verificar nomes de colunas no código..."

# Procurar por nomes em camelCase que deviam ser snake_case
grep -rn "lastAppChange" src/ && echo "❌ Usar apps_selected_at"
grep -rn "subscriptionTier" src/ && echo "❌ Usar subscription_tier"
grep -rn "fullName" src/ && echo "❌ Usar full_name"

echo "✅ Verificação completa"
```

### Verificar se o Schema Está Sincronizado

```sql
-- Correr no Supabase SQL Editor
-- Compara com .claude/supabase-schema.md

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

---

## 📚 Recursos

### Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Docs - Migrations](https://supabase.com/docs/guides/cli/local-development)

### Comandos Supabase CLI (se instalares)

```bash
# Ver estado das migrations
supabase migration list

# Criar nova migration
supabase migration new add_new_column

# Aplicar migrations
supabase db push

# Exportar schema remoto
supabase db pull
```

---

## 🚨 Erros Comuns

### 1. "column does not exist"

**Causa:** Nome de coluna errado (camelCase vs snake_case)

**Solução:**
1. Abre `.claude/supabase-schema.md`
2. Procura a tabela
3. Verifica o nome EXATO da coluna
4. Usa snake_case

### 2. "relation does not exist"

**Causa:** Nome de tabela errado ou tabela não criada

**Solução:**
1. Verifica em `.claude/supabase-schema.md` se a tabela existe
2. Se não existe, cria-a primeiro
3. Usa sempre `public.nome_tabela` ou apenas `nome_tabela`

### 3. RLS Policy Violation

**Causa:** Tentar aceder dados sem permissão

**Solução:**
1. Verifica as policies em `.claude/supabase-schema.md`
2. Confirma que estás autenticado
3. Confirma que a policy permite a operação

---

## 📝 Checklist para Claude Code

Quando trabalhares com Supabase, segue esta checklist:

- [ ] Li o `.claude/supabase-schema.md`?
- [ ] Verifiquei os nomes EXACTOS das colunas?
- [ ] Usei snake_case em vez de camelCase?
- [ ] Verifiquei os tipos de dados?
- [ ] Verifiquei as policies RLS?
- [ ] Testei a query no SQL Editor primeiro?
- [ ] Actualizei a documentação se fiz mudanças?

---

**Última atualização:** Dezembro 2024
