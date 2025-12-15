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

2. Carrega os Skills disponíveis em .claude/skills/:
   - breathofnow-dev (contexto geral do projeto)
   - frontend-design (design system e UI guidelines)
   - i18n-enforcer (internacionalização obrigatória)
   - local-first (arquitectura de dados)
   - code-review (qualidade de código)

3. Confirma que entendeste:
   - Stack tecnológico (Next.js 14, TypeScript, Tailwind, Supabase, Dexie)
   - Arquitetura local-first (IndexedDB é source of truth)
   - Convenções de nomenclatura (snake_case na DB, camelCase no TS)
   - Estrutura de pastas
   - Sistema de internacionalização (5 idiomas - ZERO texto hardcoded)

4. Verifica se tens acesso aos ficheiros críticos:
   - src/lib/db/index.ts (Dexie database)
   - src/stores/app-store.ts
   - messages/*.json (traduções)
   - tailwind.config.ts

Depois de leres tudo, confirma que estás pronto e aguarda a minha tarefa.

IMPORTANTE:
- Sempre consulta .claude/supabase-schema.md antes de escrever queries
- Nunca assumes nomes de colunas - verifica sempre
- Lembra-te: Supabase usa snake_case, TypeScript usa camelCase
- NUNCA hardcodes texto - sempre usa useTranslations()
- Dados do utilizador vão para Dexie PRIMEIRO, não Supabase
```

---

## Variante Curta (Para Tasks Rápidas)

```
Claude Code: Lê .claude/PROJECT.md, .claude/RULES.md, .claude/supabase-schema.md e os skills em .claude/skills/ antes de começar. Confirma quando estiveres pronto.
```

---

## Skills Disponíveis

O projeto tem 5 skills que são automaticamente aplicados:

| Skill | Trigger | Descrição |
|-------|---------|-----------|
| `breathofnow-dev` | Sempre | Contexto geral, stack, princípios |
| `frontend-design` | UI/componentes | Design system, cores, tipografia |
| `i18n-enforcer` | Qualquer código | Zero texto hardcoded |
| `local-first` | Dados/CRUD | IndexedDB first, sync opcional |
| `code-review` | PRs/validação | TypeScript strict, convenções |

---

## Contexto Específico por Área

### Se vais trabalhar com Base de Dados:

```
Claude Code: Vou trabalhar com queries Supabase.

ANTES de escreveres código:
1. Lê .claude/supabase-schema.md COMPLETAMENTE
2. Lê o skill local-first (.claude/skills/local-first/SKILL.md)
3. Identifica as tabelas envolvidas
4. Verifica os nomes EXACTOS das colunas (snake_case)
5. Lembra: dados do utilizador vão para Dexie PRIMEIRO

Confirma quando tiveres lido o schema.
```

### Se vais trabalhar com UI/Frontend:

```
Claude Code: Vou trabalhar no frontend.

ANTES de começares:
1. Lê o skill frontend-design (.claude/skills/frontend-design/SKILL.md)
2. Lê .claude/PROJECT.md (secção Design System)
3. Verifica os componentes em src/components/ui/
4. Confirma as cores e tipografia em tailwind.config.ts
5. Lembra-te: Fraunces para títulos, Source Sans 3 para texto

Pronto para criar UI bonito e consistente?
```

### Se vais trabalhar com Traduções:

```
Claude Code: Vou trabalhar com internacionalização.

ANTES de começares:
1. Lê o skill i18n-enforcer (.claude/skills/i18n-enforcer/SKILL.md)
2. Verifica os 5 idiomas: en, pt, pt-BR, es, fr
3. NUNCA hardcodes texto - sempre usa traduções
4. Estrutura dos namespaces: common, nav, apps, pricing, etc.

Confirma que não vais deixar nenhum texto hardcoded!
```

### Se vais criar nova feature:

```
Claude Code: Vou implementar uma nova feature.

Lê todos os skills em .claude/skills/:
1. breathofnow-dev - para contexto geral
2. frontend-design - para UI
3. i18n-enforcer - para traduções
4. local-first - para dados
5. code-review - para qualidade

Segue este workflow:
1. Entender requisitos
2. Planear arquitectura
3. Implementar com todos os skills activos
4. Verificar qualidade antes de finalizar
```

---

## Checklist de Inicialização

Depois de dar o prompt, verifica que Claude Code:

- [ ] Confirmou que leu os documentos
- [ ] Entendeu o stack tecnológico
- [ ] Conhece as convenções (snake_case vs camelCase)
- [ ] Sabe onde encontrar informação (schema, regras, etc.)
- [ ] Carregou os skills disponíveis
- [ ] Está pronto para começar a tarefa

---

## Exemplo de Resposta Esperada

```
Olá! Li todos os documentos de referência e carreguei os skills:

✅ PROJECT.md - Entendi a arquitetura local-first e o stack
✅ RULES.md - Convenções de código e commits
✅ supabase-schema.md - Schema completo, snake_case para colunas
✅ claude-code-guide.md - Boas práticas e verificações

📚 Skills carregados:
- breathofnow-dev (contexto geral)
- frontend-design (design system)
- i18n-enforcer (traduções obrigatórias)
- local-first (Dexie como source of truth)
- code-review (qualidade de código)

Principais pontos que retive:
- Next.js 14 com App Router
- IndexedDB (Dexie) é a source of truth
- Supabase para auth e sync opcional (premium)
- 5 idiomas (en, pt, pt-BR, es, fr)
- ZERO texto hardcoded
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
**Última atualização:** 15 Dezembro 2024 (adicionados Skills)
