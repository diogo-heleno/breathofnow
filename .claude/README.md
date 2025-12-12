# 📚 Índice de Documentação - .claude/

Este diretório contém toda a documentação de referência para o projeto Breath of Now.

---

## 📋 Documentos Disponíveis

### 🎯 Essenciais (Ler Sempre)

| Ficheiro | Descrição | Quando Ler |
|----------|-----------|------------|
| **PROJECT.md** | Visão geral completa do projeto | Início de cada sessão |
| **RULES.md** | Convenções e regras de desenvolvimento | Antes de escrever código |
| **supabase-schema.md** | Schema completo da base de dados | Antes de queries/DB work |

### 🚀 Workflows

| Ficheiro | Descrição | Quando Usar |
|----------|-----------|-------------|
| **INIT-PROMPT.md** | Prompt para iniciar sessão | Início de trabalho |
| **CLOSE-PROMPT.md** | Prompt para finalizar e atualizar docs | Fim de trabalho |
| **claude-code-guide.md** | Boas práticas com Claude Code | Durante desenvolvimento |

### 📁 Outros

| Ficheiro | Descrição |
|----------|-----------|
| **settings.json** | Configurações do editor |
| **commands/** | Scripts auxiliares |

---

## 🔄 Fluxo de Trabalho Recomendado

### 1. INÍCIO DE SESSÃO

```bash
# Ler documentos essenciais
1. Abre INIT-PROMPT.md
2. Copia o prompt adequado à tarefa
3. Cola no Claude Code
4. Aguarda confirmação
```

### 2. DURANTE O DESENVOLVIMENTO

```bash
# Consultar conforme necessário
- Dúvidas sobre projeto? → PROJECT.md
- Escrever queries? → supabase-schema.md
- Convenções de código? → RULES.md
- Usar Claude Code? → claude-code-guide.md
```

### 3. FIM DE SESSÃO

```bash
# Atualizar documentação
1. Abre CLOSE-PROMPT.md
2. Copia o prompt completo
3. Cola no Claude Code
4. Revê atualizações sugeridas
5. Commit das mudanças
```

---

## 📖 Como Usar Cada Documento

### PROJECT.md

**O que contém:**
- Apps do ecossistema e estados
- Stack tecnológico completo
- Arquitetura local-first
- Estrutura de pastas
- Internacionalização (5 idiomas)
- Modelo de monetização
- Schema Dexie (local)
- Design system
- Páginas implementadas
- Próximos passos

**Como usar:**
- Lê no início de cada sessão
- Consulta quando precisas de contexto
- Actualiza quando mudas algo significativo
- Marca tarefas como concluídas ✅

### RULES.md

**O que contém:**
- Convenções de commits
- Nomenclatura (arquivos, variáveis, etc.)
- Regras de TypeScript
- Estrutura de componentes
- Boas práticas

**Como usar:**
- Lê antes de escrever código novo
- Consulta quando tens dúvidas de nomenclatura
- Actualiza quando adoptas novas convenções
- Partilha com novos developers

### supabase-schema.md

**O que contém:**
- 16 tabelas com todas as colunas
- Tipos de dados e defaults
- Foreign keys e constraints
- RLS policies
- Functions e triggers
- Queries úteis
- **Queries SQL para exportar schema actualizado**

**Como usar:**
- **SEMPRE** lê antes de escrever queries
- Verifica nomes EXACTOS de colunas
- Consulta tipos de dados
- Usa queries de exemplo
- Actualiza quando mudas schema
- Corre queries de export para actualizar

**Como actualizar:**
1. Faz mudanças no Supabase Dashboard
2. Corre as queries SQL no topo do ficheiro
3. Copia os resultados
4. Pede ao Claude Code para actualizar o documento
5. Commit das mudanças

### claude-code-guide.md

**O que contém:**
- Quando usar o computer
- Quando NÃO usar o computer
- Checklist para trabalho com DB
- Erros comuns e soluções
- Tabela de referência rápida

**Como usar:**
- Consulta quando algo falha
- Revê checklist antes de queries
- Usa tabela de referência para nomes

### INIT-PROMPT.md

**O que contém:**
- Prompt completo de inicialização
- Variantes por área (DB, UI, i18n)
- Checklist de verificação
- Exemplo de resposta esperada

**Como usar:**
1. Abre o ficheiro
2. Escolhe prompt (completo ou específico)
3. Copia e cola no Claude Code
4. Aguarda confirmação
5. Começa a trabalhar

### CLOSE-PROMPT.md

**O que contém:**
- Prompt de auditoria completa
- Checklist de fecho
- Template de commit message
- Sugestão de próximos passos

**Como usar:**
1. No fim da sessão, abre o ficheiro
2. Copia o prompt completo
3. Cola no Claude Code
4. Revê atualizações sugeridas
5. Aplica mudanças
6. Faz commit

---

## 🎯 Atalhos Rápidos

### Início Rápido
```bash
# Para iniciar trabalho geral
cat .claude/INIT-PROMPT.md | grep -A 20 "Prompt Completo"

# Para trabalho com DB
cat .claude/INIT-PROMPT.md | grep -A 10 "Base de Dados"
```

### Consulta Rápida
```bash
# Ver nomes de tabelas
cat .claude/supabase-schema.md | grep "^###"

# Ver colunas de uma tabela específica
cat .claude/supabase-schema.md | grep -A 30 "### 11. \`profiles\`"
```

### Finalização Rápida
```bash
# Ver checklist de fecho
cat .claude/CLOSE-PROMPT.md | grep -A 20 "Checklist de Fecho"
```

---

## 🔄 Manutenção dos Documentos

### Atualização Regular

**Semanal:**
- PROJECT.md → Actualiza estado das apps
- PROJECT.md → Marca tarefas concluídas

**Quando há mudanças:**
- supabase-schema.md → Actualiza schema
- RULES.md → Documenta novas convenções
- PROJECT.md → Actualiza estrutura/dependências

**Sempre que terminas trabalho:**
- Use CLOSE-PROMPT.md → Actualiza tudo

### Verificação de Consistência

Mensalmente, verifica:
- [ ] Todas as datas estão correctas?
- [ ] Schema está sincronizado com Supabase?
- [ ] PROJECT.md reflecte o estado actual?
- [ ] Não há informação desactualizada?
- [ ] Novos developers conseguem onboard facilmente?

---

## 💡 Dicas

### Para Ti (Diogo)

1. **Sempre usa INIT-PROMPT** no início → Claude Code trabalha melhor
2. **Consulta supabase-schema** antes de DB work → Evita erros
3. **Usa CLOSE-PROMPT** no fim → Documentação sempre actualizada
4. **Mantém PROJECT.md actualizado** → Facilitates future work

### Para Claude Code

1. **Lê documentos antes de começar** → Contexto completo
2. **Verifica schema antes de queries** → Nomes correctos
3. **Actualiza docs no fim** → Mantém sincronização
4. **Sugere melhorias** → Documentação viva

### Para Novos Developers

1. Começa por ler PROJECT.md
2. Depois RULES.md
3. Explora supabase-schema.md
4. Usa INIT-PROMPT sempre
5. Faz perguntas específicas ao Claude Code

---

## 📞 Questões Frequentes

**Q: Devo ler tudo de cada vez?**  
A: Não. Lê PROJECT.md no início, depois consulta os outros conforme necessário.

**Q: E se esquecer de usar INIT-PROMPT?**  
A: Claude Code pode funcionar, mas com menos contexto. Melhor usar sempre.

**Q: Quando actualizar supabase-schema.md?**  
A: Sempre que mudares algo no Supabase. Usa as queries SQL do documento.

**Q: Os prompts são obrigatórios?**  
A: Não, mas são altamente recomendados para melhor qualidade.

**Q: Posso modificar os documentos?**  
A: Sim! São ferramentas para te ajudar. Adapta conforme necessário.

---

## 🎓 Próximos Passos

Depois de ler este índice:

1. ✅ Lê PROJECT.md para contexto geral
2. ✅ Guarda INIT-PROMPT.md nos favoritos
3. ✅ Experimenta um workflow completo (INIT → trabalho → CLOSE)
4. ✅ Personaliza os prompts conforme teu estilo
5. ✅ Mantém documentação actualizada

---

**Boa sorte com o desenvolvimento! 🚀**

---

**Criado:** 12 Dezembro 2024  
**Mantido por:** Diogo (M21 Global, Lda)
