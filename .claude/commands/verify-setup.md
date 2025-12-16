# Verify Setup Command

Verifica se a configuração do Claude Code está correta e completa.

## O que verificar

### 1. Ficheiros obrigatórios existem

```bash
# Verificar estrutura .claude/
ls -la .claude/
ls -la .claude/commands/
```

Ficheiros esperados:
- [ ] `.claude/PROJECT.md`
- [ ] `.claude/RULES.md`
- [ ] `.claude/settings.json`
- [ ] `.claude/commands/build.md`
- [ ] `.claude/commands/commit.md`
- [ ] `.claude/commands/dev.md`
- [ ] `.claude/commands/lint.md`
- [ ] `.claude/commands/i18n-check.md`
- [ ] `.claude/commands/update-docs.md`
- [ ] `.claude/commands/verify-setup.md`
- [ ] `CLAUDE.md` (na raiz)

### 2. Conteúdo dos ficheiros está correto

Verificar que:

**CLAUDE.md** contém:
- Secção "⚠️ IMPORTANTE - Leitura Obrigatória"
- Referência a `.claude/RULES.md`
- Referência a `.claude/PROJECT.md`
- Lista de comandos disponíveis

**RULES.md** contém:
- Regra #1: i18n obrigatória
- Regra #2: Atualização de documentação com aprovação
- Regra #3: Convenções de código
- Regra #4: Estrutura de ficheiros
- Regra #5: Checklist de verificação

### 3. Traduções existem

```bash
ls -la messages/
```

Ficheiros esperados:
- [ ] `messages/en.json`
- [ ] `messages/pt.json`
- [ ] `messages/es.json`
- [ ] `messages/fr.json`

## Formato de Output

```
🔍 VERIFICAÇÃO DE SETUP - Claude Code

═══════════════════════════════════════════════════════════════

📁 ESTRUTURA DE FICHEIROS

.claude/
├── PROJECT.md        ✅ Existe
├── RULES.md          ✅ Existe | ❌ EM FALTA
├── settings.json     ✅ Existe
└── commands/
    ├── build.md      ✅ Existe
    ├── commit.md     ✅ Existe
    ├── dev.md        ✅ Existe
    ├── lint.md       ✅ Existe
    ├── i18n-check.md ✅ Existe | ❌ EM FALTA
    ├── update-docs.md ✅ Existe | ❌ EM FALTA
    └── verify-setup.md ✅ Existe | ❌ EM FALTA

CLAUDE.md (raiz)      ✅ Existe | ❌ EM FALTA

═══════════════════════════════════════════════════════════════

📄 CONTEÚDO DOS FICHEIROS

CLAUDE.md:
- Referência a RULES.md:    ✅ OK | ❌ EM FALTA
- Referência a PROJECT.md:  ✅ OK | ❌ EM FALTA
- Lista de comandos:        ✅ OK | ❌ EM FALTA

RULES.md:
- Regra i18n:               ✅ OK | ❌ EM FALTA
- Regra documentação:       ✅ OK | ❌ EM FALTA
- Regra código:             ✅ OK | ❌ EM FALTA

═══════════════════════════════════════════════════════════════

🌍 FICHEIROS DE TRADUÇÃO

messages/
├── en.json           ✅ Existe
├── pt.json           ✅ Existe
├── es.json           ✅ Existe
└── fr.json           ✅ Existe

═══════════════════════════════════════════════════════════════

📊 RESUMO

Setup completo: ✅ SIM | ❌ NÃO

Ficheiros em falta: [lista se houver]
Conteúdo em falta: [lista se houver]

═══════════════════════════════════════════════════════════════
```

## Se houver problemas

Indicar exatamente:
1. O que está em falta
2. Como resolver (criar ficheiro, adicionar conteúdo)
3. Oferecer para corrigir automaticamente
