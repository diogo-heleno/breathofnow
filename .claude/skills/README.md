# Claude Code Skills - Breath of Now

Esta pasta contém Skills personalizados para o desenvolvimento do Breath of Now.

## O que são Skills?

Skills são ficheiros SKILL.md que ensinam o Claude Code como comportar-se em situações específicas. São automaticamente carregados quando o Claude acede ao repositório.

## Skills Disponíveis

| Skill | Ficheiro | Descrição |
|-------|----------|-----------|
| **breathofnow-dev** | `breathofnow-dev/SKILL.md` | Contexto geral do projeto, stack, princípios de desenvolvimento |
| **frontend-design** | `frontend-design/SKILL.md` | Design system, cores, tipografia, componentes UI |
| **i18n-enforcer** | `i18n-enforcer/SKILL.md` | Internacionalização - zero texto hardcoded |
| **local-first** | `local-first/SKILL.md` | Arquitectura de dados - IndexedDB é source of truth |
| **code-review** | `code-review/SKILL.md` | Qualidade de código, TypeScript strict, convenções |

## Quando São Usados

### breathofnow-dev
- **Trigger**: Sempre activo
- **Uso**: Fornece contexto geral para qualquer tarefa

### frontend-design
- **Trigger**: Criar UI, componentes, páginas
- **Uso**: Garante consistência visual com o design system

### i18n-enforcer
- **Trigger**: Qualquer código com texto visível
- **Uso**: Enforça traduções, rejeita texto hardcoded

### local-first
- **Trigger**: Trabalhar com dados, CRUD, sync
- **Uso**: Garante que Dexie é usado antes de Supabase

### code-review
- **Trigger**: PRs, validação, CLOSE-PROMPT
- **Uso**: Verifica qualidade antes de commit

## Como Funciona

1. O Claude Code lê automaticamente os ficheiros SKILL.md
2. As instruções são aplicadas às tarefas relevantes
3. Os prompts INIT-PROMPT e CLOSE-PROMPT referenciam os skills

## Estrutura de um Skill

```markdown
---
name: skill-name
description: Breve descrição do skill
---

# Título do Skill

Instruções detalhadas...

## Quando Usar
...

## Regras
...

## Exemplos
...
```

## Actualizar Skills

Para modificar um skill:
1. Edita o ficheiro SKILL.md correspondente
2. Commit e push
3. As alterações são automaticamente aplicadas

## Criar Novo Skill

1. Cria pasta em `.claude/skills/nome-do-skill/`
2. Adiciona `SKILL.md` com frontmatter e instruções
3. Referencia no INIT-PROMPT se necessário

---

**Criado:** 15 Dezembro 2024
