# Update Documentation Command

Analisa as alterações recentes e propõe atualizações à documentação do projeto.

## Quando usar

- Após implementar novas funcionalidades
- Após alterações significativas à arquitetura
- Após adicionar novos componentes ou páginas
- Após modificar schemas de base de dados
- Periodicamente para manter documentação atualizada

## Passos a executar

1. **Analisar alterações recentes**
   ```bash
   git status
   git diff --stat HEAD~5
   ```

2. **Identificar o que mudou**
   - Novas páginas/rotas
   - Novos componentes
   - Alterações a schemas
   - Novas dependências
   - Funcionalidades implementadas

3. **Comparar com documentação atual**
   - Ler `.claude/PROJECT.md`
   - Identificar secções desatualizadas
   - Identificar informação em falta

4. **Propor atualizações**

## Formato de Output

Para CADA proposta de alteração (uma de cada vez):

```
📝 PROPOSTA DE ATUALIZAÇÃO - PROJECT.md

Secção: [nome da secção existente ou "Nova Secção: nome"]
Tipo: Adição | Modificação | Remoção
Razão: [explicação breve de porque esta atualização é necessária]

Conteúdo atual (se modificação):
---
[conteúdo existente que será alterado]
---

Conteúdo proposto:
---
[markdown formatado com a alteração]
---

Confirmas esta alteração? (OK/Não)
```

## Regras OBRIGATÓRIAS

1. ⚠️ **NUNCA** atualizar documentação sem aprovação explícita
2. ⚠️ **SEMPRE** mostrar a alteração completa antes de aplicar
3. ⚠️ **AGUARDAR** resposta "OK" do utilizador
4. ⚠️ **UMA** proposta de cada vez (não agrupar múltiplas alterações)
5. ⚠️ Se utilizador disser "Não", abandonar essa proposta e passar à próxima

## Exemplos de propostas válidas

### Exemplo 1: Nova página implementada

```
📝 PROPOSTA DE ATUALIZAÇÃO - PROJECT.md

Secção: 10. Páginas Implementadas
Tipo: Adição
Razão: Nova página de histórico do FitLog foi implementada

Conteúdo proposto:
---
| FitLog History | `/[locale]/fitlog/history` | ✅ |
| FitLog Session Detail | `/[locale]/fitlog/history/[sessionId]` | ✅ |
---

Confirmas esta alteração? (OK/Não)
```

### Exemplo 2: Novo componente

```
📝 PROPOSTA DE ATUALIZAÇÃO - PROJECT.md

Secção: 9. Design System (Implementado) > Componentes UI
Tipo: Adição
Razão: Novo componente ConnectionIndicator adicionado para PWA

Conteúdo proposto:
---
| **ConnectionIndicator** | online, offline, syncing | ✅ |
---

Confirmas esta alteração? (OK/Não)
```

## Secções do PROJECT.md a verificar

1. Apps do Ecossistema (estados)
2. Stack Tecnológico (versões)
3. Estrutura de Pastas
4. Páginas Implementadas
5. Componentes UI
6. Schema da Base de Dados
7. Próximos Passos (completados vs pendentes)

## Após aprovação

Quando utilizador confirmar com "OK":

1. Aplicar a alteração ao ficheiro
2. Confirmar que foi aplicada
3. Passar à próxima proposta (se houver)
