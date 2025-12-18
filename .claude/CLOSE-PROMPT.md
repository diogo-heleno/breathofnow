# 🏁 Prompt de Fecho - Claude Code

Use este prompt no final de cada sessão de trabalho para garantir que toda a documentação fica atualizada e a qualidade do código está verificada.

---

## Prompt Completo

```
Claude Code: Terminamos o trabalho por hoje. Antes de fecharmos a sessão, preciso que faças uma auditoria completa usando o skill code-review (.claude/skills/code-review/SKILL.md) e actualizes toda a documentação necessária.

Por favor, executa os seguintes passos:

## 1. ANÁLISE DE MUDANÇAS

Revê todas as alterações que fizemos hoje e identifica:
- Que ficheiros foram criados ou modificados?
- Que funcionalidades foram adicionadas?
- Houve mudanças no schema da base de dados?
- Foram adicionadas/removidas dependências?
- Foram criados novos componentes ou pages?
- Mudou alguma convenção de código?

## 2. VERIFICAÇÃO DE QUALIDADE (Skill: code-review)

Aplica o skill code-review para verificar:
- [ ] Sem tipos `any` no código novo
- [ ] Sem texto hardcoded (i18n compliance)
- [ ] Dados do utilizador usam Dexie, não Supabase directo
- [ ] Sem console.log de debug esquecidos
- [ ] Error handling em operações async
- [ ] Convenções de nomenclatura respeitadas

## 3. ATUALIZAÇÃO DE DOCUMENTAÇÃO

Com base nas mudanças, actualiza os seguintes ficheiros:

### .claude/PROJECT.md
- Actualiza secção "Apps do Ecossistema" (estado de cada app)
- Actualiza "Páginas Implementadas" (adiciona novas rotas)
- Actualiza "Próximos Passos" (marca concluídos ✅, adiciona novos)
- Actualiza "Estrutura de Pastas" se aplicável
- Actualiza data: "Última atualização: [DATA DE HOJE]"

### .claude/supabase-schema.md (SE aplicável)
- Adiciona novas tabelas criadas
- Actualiza colunas modificadas
- Adiciona novos constraints/foreign keys
- Actualiza RLS policies se mudaram
- Adiciona novas functions/triggers
- Actualiza queries úteis se necessário
- Actualiza data de verificação

### .claude/RULES.md (SE aplicável)
- Adiciona novas convenções identificadas
- Actualiza regras que mudaram
- Documenta novos padrões de código

### README.md raiz (SE aplicável)
- Actualiza features implementadas
- Actualiza instruções de setup se mudaram
- Adiciona novos scripts npm se criados

### package.json (verificar)
- Todas as dependências estão listadas?
- Versões estão correctas?

## 3. VERIFICAÇÃO FINAL

Antes de terminar, confirma (usando os skills):
- [ ] Todos os ficheiros de código têm comentários adequados?
- [ ] Não há TODOs ou FIXMEs esquecidos?
- [ ] Não há console.logs de debug esquecidos?
- [ ] Todos os componentes têm PropTypes/Types adequados?
- [ ] Não há imports não utilizados?
- [ ] Não há variáveis declaradas mas não usadas?
- [ ] Texto hardcoded? (skill: i18n-enforcer)
- [ ] Dados a ir directo para Supabase? (skill: local-first)
- [ ] Tipos `any` no código? (skill: code-review)

## 4. RESUMO PARA COMMIT

Gera uma mensagem de commit seguindo o formato:

tipo(scope): descrição curta

- Mudança 1
- Mudança 2
- Mudança 3

Files changed: [lista de ficheiros principais]


Tipos: feat, fix, docs, style, refactor, test, chore

## 5. PRÓXIMOS PASSOS

Sugere 3-5 próximos passos lógicos para continuar o desenvolvimento, com base no que fizemos hoje.

---

IMPORTANTE:
- Sê específico nas actualizações (não generic)
- Mantém consistência de formatação
- Actualiza datas em todos os documentos modificados
- Verifica que toda a documentação está sincronizada

Antes de terminar a sessão, verifica:

### Documentação
- [ ] PROJECT.md está actualizado?
- [ ] supabase-schema.md reflecte mudanças na DB?
- [ ] RULES.md tem novas convenções?
- [ ] Todas as datas foram actualizadas?

### Código
- [ ] Sem console.logs de debug?
- [ ] Sem TODOs críticos não documentados?
- [ ] Imports limpos (sem não utilizados)?
- [ ] Tipos/PropTypes correctos?

### Git
- [ ] Mensagem de commit preparada?
- [ ] Ficheiros importantes não esquecidos?
- [ ] .gitignore actualizado se necessário?

### Planeamento
- [ ] Próximos passos identificados?
- [ ] Bloqueadores documentados?
- [ ] Issues críticas reportadas?



```

---

## Variante Rápida (Para Changes Pequenas)

```
Claude Code: Finalização rápida.

1. Actualiza .claude/PROJECT.md:
   - Data de "Última atualização"
   - Marca tarefas concluídas nos "Próximos Passos"

2. Gera mensagem de commit para as mudanças de hoje

3. Sugere 2-3 próximos passos
```

---

## Checklist de Fecho

Antes de terminar a sessão, verifica:

### Documentação
- [ ] PROJECT.md está actualizado?
- [ ] supabase-schema.md reflecte mudanças na DB?
- [ ] RULES.md tem novas convenções?
- [ ] Todas as datas foram actualizadas?

### Código
- [ ] Sem console.logs de debug?
- [ ] Sem TODOs críticos não documentados?
- [ ] Imports limpos (sem não utilizados)?
- [ ] Tipos/PropTypes correctos?

### Git
- [ ] Mensagem de commit preparada?
- [ ] Ficheiros importantes não esquecidos?
- [ ] .gitignore actualizado se necessário?

### Planeamento
- [ ] Próximos passos identificados?
- [ ] Bloqueadores documentados?
- [ ] Issues críticas reportadas?

---

## Exemplo de Resposta Esperada

```
Auditoria completa realizada. Aqui está o resumo:

## MUDANÇAS REALIZADAS

### Ficheiros Criados
- src/app/[locale]/expenses/reports/page.tsx
- src/components/expenses/expense-chart.tsx

### Ficheiros Modificados
- src/stores/expense-store.ts (adicionar função de export)
- messages/en.json, pt.json, etc. (adicionar traduções de reports)

### Funcionalidades Adicionadas
- Página de relatórios do ExpenseFlow
- Gráfico de despesas por categoria
- Export de dados para JSON

## DOCUMENTAÇÃO ATUALIZADA

### .claude/PROJECT.md
✅ Actualizada secção "Páginas Implementadas"
✅ Marcado "Relatórios anuais" como concluído
✅ Data actualizada para hoje

### .claude/supabase-schema.md
ℹ️ Sem mudanças necessárias (não houve alterações na DB)

### messages/*.json
✅ Todas as traduções adicionadas para "reports"

## VERIFICAÇÃO FINAL

✅ Sem console.logs de debug
✅ Sem TODOs críticos
✅ Todos os imports limpos
✅ PropTypes correctos
⚠️ 1 tipo a melhorar em expense-chart.tsx (não crítico)

## MENSAGEM DE COMMIT

feat(expenses): add reports page with category charts

- Create reports page with monthly/yearly views
- Add pie chart component for category breakdown
- Implement JSON export functionality
- Add translations for reports section (5 languages)

Files changed:
- src/app/[locale]/expenses/reports/page.tsx
- src/components/expenses/expense-chart.tsx
- src/stores/expense-store.ts
- messages/*.json

## PRÓXIMOS PASSOS SUGERIDOS

1. **Prioridade Alta:**
   - Adicionar filtros de data aos relatórios
   - Implementar export para CSV/Excel
   - Adicionar gráfico de linha para tendências

2. **Prioridade Média:**
   - Melhorar tipo do ExpenseChart (warning identificado)
   - Adicionar comparação ano-a-ano
   - Implementar drill-down por categoria

3. **Prioridade Baixa:**
   - Adicionar impressão de relatórios
   - Criar PDFs com relatórios
   - Dashboard com widgets customizáveis

Tudo actualizado e pronto para commit! 🎉
```

---

## Quando Usar Este Prompt

**SEMPRE usar:**
- No final de cada sessão de trabalho
- Antes de fazer commit de mudanças significativas
- Antes de fechar o Claude Code por hoje
- Depois de implementar features completas

**Opcional:**
- Mudanças muito pequenas (typo fixes)
- Ajustes CSS que não afectam funcionalidade
- Trabalho em progresso que continuará amanhã

---

## Template de Commit Message

```
tipo(scope): descrição curta (máx 50 chars)

Descrição mais detalhada do que foi feito e porquê.
Pode ter múltiplas linhas.

- Lista de mudanças principais
- Outra mudança
- Mais uma mudança

Breaking Changes: (se aplicável)
- Mudança que quebra compatibilidade

Files changed:
- path/to/file1.ts
- path/to/file2.tsx
- path/to/file3.json

Related: #issue-number (se aplicável)
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
- `auth`: Autenticação
- `i18n`: Internacionalização
- `db`: Base de dados
- `ui`: Interface/Componentes
- `config`: Configuração
- `deps`: Dependências

---

## Automatização (Opcional)

Se quiseres automatizar parte deste processo, podes criar um script:

```bash
# .claude/commands/finalize.sh
#!/bin/bash

echo "🔍 A verificar mudanças..."
git status --short

echo ""
echo "📝 Ficheiros a atualizar:"
echo "  - .claude/PROJECT.md"
echo "  - .claude/supabase-schema.md (se aplicável)"
echo ""

read -p "Pedir ao Claude Code para atualizar documentação? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "Cole este prompt no Claude Code:"
    echo "---"
    cat .claude/CLOSE-PROMPT.md
fi
```

---

## Skills Usados no Fecho

O CLOSE-PROMPT utiliza automaticamente estes skills:

| Skill | Verificação |
|-------|-------------|
| `code-review` | Qualidade geral, tipos, error handling |
| `i18n-enforcer` | Texto hardcoded |
| `local-first` | Arquitectura de dados |

---

**Criado:** 12 Dezembro 2024  
**Última atualização:** 15 Dezembro 2024 (integração com Skills)
