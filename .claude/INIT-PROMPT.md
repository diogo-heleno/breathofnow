# 🚀 Prompt de Inicialização - Claude Code

Use este prompt sempre que iniciar uma nova sessão com Claude Code para este projeto.

---

## Prompt Completo

```
Olá Claude Code! Vou trabalhar no projeto Breath of Now.

ANTES de começares qualquer tarefa, por favor:

1. Lê os seguintes documentos de referência na ordem indicada:
   - .claude/PROJECT.md (visão geral do projeto)
   - .claude/RULES.md (regras de desenvolvimento)
   - .claude/supabase-schema.md (schema da base de dados)
   - .claude/claude-code-guide.md (guia de boas práticas)

2. Confirma que entendeste:
   - Stack tecnológico (Next.js 14, TypeScript, Tailwind, Supabase, Dexie)
   - Arquitetura local-first
   - Convenções de nomenclatura (snake_case na DB, camelCase no TS)
   - Estrutura de pastas
   - Sistema de internacionalização (5 idiomas)

3. Verifica se tens acesso aos ficheiros críticos:
   - src/lib/supabase/client.ts
   - src/stores/app-store.ts
   - messages/*.json (traduções)
   - tailwind.config.ts

Depois de leres tudo, confirma que estás pronto e aguarda a minha tarefa.

IMPORTANTE:
- Sempre consulta .claude/supabase-schema.md antes de escrever queries
- Nunca assumes nomes de colunas - verifica sempre
- Lembra-te: Supabase usa snake_case, TypeScript usa camelCase
- A coluna é apps_selected_at, NÃO last_app_change
```

---

## Variante Curta (Para Tasks Rápidas)

```
Claude Code: Lê .claude/PROJECT.md, .claude/RULES.md e .claude/supabase-schema.md antes de começar. Confirma quando estiveres pronto.
```

---

## Contexto Específico por Área

### Se vais trabalhar com Base de Dados:

```
Claude Code: Vou trabalhar com queries Supabase.

ANTES de escreveres código:
1. Lê .claude/supabase-schema.md COMPLETAMENTE
2. Identifica as tabelas envolvidas
3. Verifica os nomes EXACTOS das colunas (snake_case)
4. Confirma os tipos de dados
5. Verifica as foreign keys e constraints

Confirma quando tiveres lido o schema.
```

### Se vais trabalhar com UI/Frontend:

```
Claude Code: Vou trabalhar no frontend.

ANTES de começares:
1. Lê .claude/PROJECT.md (secção Design System)
2. Verifica os componentes em src/components/ui/
3. Confirma as cores e tipografia em tailwind.config.ts
4. Lembra-te: Fraunces para títulos, Source Sans 3 para texto

Pronto para criar UI bonito e consistente?
```

### Se vais trabalhar com Traduções:

```
Claude Code: Vou trabalhar com internacionalização.

ANTES de começares:
1. Lê .claude/PROJECT.md (secção Internacionalização)
2. Verifica os 5 idiomas: en, pt, pt-BR, es, fr
3. NUNCA hardcodes texto - sempre usa traduções
4. Estrutura dos namespaces: common, nav, apps, pricing, etc.

Confirma que não vais deixar nenhum texto hardcoded!
```

---

## Checklist de Inicialização

Depois de dar o prompt, verifica que Claude Code:

- [ ] Confirmou que leu os documentos
- [ ] Entendeu o stack tecnológico
- [ ] Conhece as convenções (snake_case vs camelCase)
- [ ] Sabe onde encontrar informação (schema, regras, etc.)
- [ ] Está pronto para começar a tarefa

---

## Exemplo de Resposta Esperada

```
Olá! Li todos os documentos de referência:

✅ PROJECT.md - Entendi a arquitetura local-first e o stack
✅ RULES.md - Convenções de código e commits
✅ supabase-schema.md - 16 tabelas, sei que apps_selected_at é snake_case
✅ claude-code-guide.md - Boas práticas e verificações

Principais pontos que retive:
- Next.js 14 com App Router
- Supabase para auth e sync opcional
- Dexie.js para storage local
- 5 idiomas (en, pt, pt-BR, es, fr)
- Snake_case na DB, camelCase no TypeScript

Tenho acesso a todos os ficheiros críticos. Pronto para começar!

Qual é a tarefa?
```

---

## 🎯 Quando Usar Este Prompt

**SEMPRE usar no início de:**
- Nova sessão de trabalho
- Depois de mudanças significativas no projeto
- Quando Claude Code parece "esquecido" do contexto
- Antes de tarefas complexas que envolvem múltiplas áreas

**Opcional (já tem contexto):**
- Tasks muito pequenas (typo fixes, ajustes CSS simples)
- Continuação imediata de trabalho anterior
- Claude Code acabou de ler os docs há < 10 minutos

---

**Criado:** 12 Dezembro 2024  
**Última atualização:** 12 Dezembro 2024
