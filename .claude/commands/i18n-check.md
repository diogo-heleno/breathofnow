# i18n Check Command

Verifica se existem strings hardcoded no código que deviam usar o sistema de traduções.

## Quando usar

- Antes de cada commit
- Após implementar novas funcionalidades
- Para auditoria periódica do código
- Quando receberes erro de texto não traduzido

## Passos a executar

### 1. Procurar texto hardcoded

```bash
# Texto entre tags JSX (ex: >Hello World<)
grep -rn --include="*.tsx" ">[A-Z][a-zA-Z ]\{3,\}<" src/

# Strings longas em atributos ou variáveis
grep -rn --include="*.tsx" '"[A-Z][a-zA-Z ]\{10,\}"' src/

# Texto em português hardcoded
grep -rn --include="*.tsx" -E '"(Voltar|Guardar|Cancelar|Erro|Sucesso)"' src/

# Texto em placeholders
grep -rn --include="*.tsx" 'placeholder="[A-Z]' src/

# Texto em aria-labels (alguns precisam i18n)
grep -rn --include="*.tsx" 'aria-label="[A-Z][a-zA-Z ]\{5,\}"' src/
```

### 2. Analisar cada ocorrência

Para cada texto encontrado, classificar como:

- 🔴 **Precisa i18n** - Texto visível ao utilizador
- 🟢 **Exceção válida** - Nome de marca, símbolo, código técnico
- 🟡 **Verificar** - Pode ou não precisar dependendo do contexto

### 3. Verificar ficheiros de tradução

```bash
# Listar todos os ficheiros de tradução
ls -la messages/

# Verificar se têm as mesmas chaves
diff <(jq -r 'paths | join(".")' messages/en.json | sort) \
     <(jq -r 'paths | join(".")' messages/pt.json | sort)
```

## Formato de Output

```
🔍 VERIFICAÇÃO i18n - Breath of Now

Data: [data atual]
Ficheiros analisados: [número]

═══════════════════════════════════════════════════════════════

🔴 TEXTO HARDCODED ENCONTRADO (requer correção)

📁 src/components/fitlog/session/index.tsx
   Linha 68:  "Sair"
   → Sugestão: fitlog.session.actions.exit
   
   Linha 174: "Séries"
   → Sugestão: fitlog.session.labels.sets
   
   Linha 445: "Tempo de Descanso"
   → Sugestão: fitlog.session.labels.restTime

📁 src/app/[locale]/fitlog/export/page.tsx
   Linha 29:  "Exportar para AI"
   → Sugestão: fitlog.export.title
   
   Linha 69:  "Como usar"
   → Sugestão: fitlog.export.howToUse

═══════════════════════════════════════════════════════════════

🟢 EXCEÇÕES VÁLIDAS (não requerem ação)

📁 src/components/brand/logo.tsx
   Linha 59:  "BreathofNow" - Nome de marca ✓

📁 src/components/expenses/expense-layout.tsx
   Linha 69:  "ExpenseFlow" - Nome de marca ✓

═══════════════════════════════════════════════════════════════

📊 RESUMO

Total de ocorrências: XX
- Requerem i18n: XX
- Exceções válidas: XX
- A verificar: XX

Ficheiros de tradução a atualizar:
- messages/en.json
- messages/pt.json
- messages/pt-BR.json
- messages/es.json
- messages/fr.json

═══════════════════════════════════════════════════════════════

Queres que gere as traduções para os textos encontrados? (Sim/Não)
```

## Se utilizador confirmar geração de traduções

### Formato de traduções geradas:

```
📝 TRADUÇÕES A ADICIONAR

Namespace: fitlog.session

{
  "actions": {
    "exit": {
      "en": "Exit",
      "pt": "Sair",
      "pt-BR": "Sair",
      "es": "Salir",
      "fr": "Quitter"
    }
  },
  "labels": {
    "sets": {
      "en": "Sets",
      "pt": "Séries",
      "pt-BR": "Séries",
      "es": "Series",
      "fr": "Séries"
    },
    "restTime": {
      "en": "Rest Time",
      "pt": "Tempo de Descanso",
      "pt-BR": "Tempo de Descanso",
      "es": "Tiempo de Descanso",
      "fr": "Temps de Repos"
    }
  }
}

Queres que aplique estas traduções aos ficheiros? (Sim/Não)
```

## Exceções válidas (não reportar)

- Nomes de marca: BreathofNow, ExpenseFlow, InvestTrack, FitLog, etc.
- Símbolos: €, $, %, +, -, ×, etc.
- Códigos técnicos: IDs, classes CSS, variáveis
- Números isolados
- URLs e paths
- aria-labels que são identificadores técnicos (não texto para utilizador)
- Conteúdo dentro de `{/* comentários */}`
- Strings em console.log (devem ser removidos de produção)

## Namespaces recomendados

| App/Área | Namespace |
|----------|-----------|
| Comum (botões, erros) | `common.` |
| Navegação | `navigation.` |
| ExpenseFlow | `expenses.` |
| InvestTrack | `investments.` |
| FitLog | `fitlog.` |
| Autenticação | `auth.` |
| Configurações | `settings.` |
| PWA/Offline | `pwa.` |

## Após correção

Verificar novamente:

```bash
npm run lint
npx tsc --noEmit
npm run build
```
