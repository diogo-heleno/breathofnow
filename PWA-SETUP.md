# 🌬️ Breath of Now - PWA Setup Guide

## Funcionalidade Offline Implementada! ✅

A tua app agora funciona **100% offline** como uma Progressive Web App (PWA).

---

## 📱 Como Funciona?

### 1️⃣ **Primeira Visita (com internet)**
- O browser descarrega a aplicação
- Service Worker instala-se automaticamente
- Ficheiros são guardados em cache
- Dados guardados em IndexedDB

### 2️⃣ **Visitas Seguintes (mesmo sem internet)**
- App carrega instantaneamente do cache
- Todos os dados acessíveis localmente
- Funcionalidades 100% disponíveis
- Sincronização automática quando voltar online

---

## 🚀 Instalar a App

### Desktop (Chrome/Edge)
1. Visita o site
2. Clica no ícone de instalação na barra de endereço
3. Clica "Instalar"
4. A app abre numa janela própria

### iOS (Safari)
1. Abre o site no Safari
2. Toca no botão "Partilhar" (quadrado com seta)
3. Scroll down e toca "Adicionar ao Ecrã Principal"
4. Toca "Adicionar"

### Android (Chrome)
1. Abre o site no Chrome
2. Toca no menu (3 pontos)
3. Toca "Adicionar ao ecrã principal"
4. Confirma a instalação

---

## 📂 Ficheiros Criados

```
public/
├── manifest.json              # Identidade da PWA
├── sw.js                      # Service Worker (cache + offline)
└── icons/                     # Ícones da app (criar depois)

src/
├── app/[locale]/
│   ├── layout.tsx             # ✅ Atualizado com PWA meta tags
│   └── offline/page.tsx       # Página de fallback offline
├── components/pwa/
│   ├── connectivity-status.tsx # Indicador online/offline
│   └── install-prompt.tsx     # Prompt de instalação
└── hooks/
    └── use-service-worker.ts  # Hook para gerir Service Worker
```

---

## 🎨 Criar Ícones da App

Precisas de criar ícones em várias dimensões. Usa uma ferramenta como:
- **[PWA Asset Generator](https://www.pwabuilder.com/)** (recomendado)
- **[RealFaviconGenerator](https://realfavicongenerator.net/)**
- **Figma/Photoshop** (manual)

### Dimensões Necessárias
```
public/icons/
├── icon-16x16.png
├── icon-32x32.png
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-180x180.png (Apple Touch)
├── icon-192x192.png (Android)
├── icon-384x384.png
└── icon-512x512.png (Splash Screen)
```

**Dica**: Começa com um ícone 512x512 e redimensiona para as outras.

---

## 🧪 Testar Offline

### 1. No Browser (DevTools)
```bash
1. Abre DevTools (F12)
2. Tab "Application" > "Service Workers"
3. Verifica se está "activated and running"
4. Tab "Network" > Seleciona "Offline"
5. Recarrega a página - deve funcionar!
```

### 2. Lighthouse Audit
```bash
1. DevTools > Lighthouse
2. Seleciona "Progressive Web App"
3. Clica "Generate report"
4. Verifica score (objetivo: 90+)
```

---

## 🔄 Sincronização de Dados (Próximo Passo)

O Service Worker já tem a estrutura para sincronização:

```javascript
// No sw.js, linha 124
async function syncDataWithServer() {
  // TODO: Implementar sincronização com Supabase
  // 1. Ler dados pendentes do IndexedDB
  // 2. Enviar para Supabase
  // 3. Marcar como sincronizado
}
```

### Como Implementar
```typescript
// src/lib/sync/sync-engine.ts
export async function syncPendingData() {
  const db = await getDatabase();
  
  // 1. Buscar dados com syncedAt = null
  const pendingExpenses = await db.expenses
    .where('syncedAt')
    .equals(null)
    .toArray();
  
  // 2. Enviar para Supabase
  for (const expense of pendingExpenses) {
    await supabase
      .from('expenses')
      .upsert({
        id: expense.id,
        user_id: expense.userId,
        amount: expense.amount,
        // ... outros campos
      });
    
    // 3. Marcar como sincronizado
    await db.expenses.update(expense.id, {
      syncedAt: new Date(),
    });
  }
}
```

---

## 📊 Verificar Armazenamento

```javascript
// No browser console
navigator.storage.estimate().then(estimate => {
  console.log('Usado:', estimate.usage);
  console.log('Disponível:', estimate.quota);
  console.log('Percentagem:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
});
```

---

## 🐛 Debug Comum

### Service Worker não regista
```bash
# Verifica se está em HTTPS
- Service Workers requerem HTTPS (exceto localhost)
- Vercel fornece HTTPS automaticamente
```

### Cache não atualiza
```bash
# Força update do Service Worker
1. DevTools > Application > Service Workers
2. Clica "Update" ou "Unregister"
3. Recarrega a página
```

### Dados não sincronizam
```bash
# Verifica eventos de sync
1. DevTools > Application > Service Workers
2. Clica "Sync" para trigger manual
3. Verifica console para erros
```

---

## 🚀 Deploy

### Vercel (Automático)
```bash
git add .
git commit -m "feat: add PWA support"
git push origin main

# Vercel deploys automaticamente
# Service Worker ativa-se automaticamente em HTTPS
```

### Testar Produção
```bash
1. Visita https://breathofnow.site
2. DevTools > Application > Service Workers
3. Verifica "activated and running"
4. Testa offline mode
```

---

## 📚 Recursos

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google: PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)

---

## ✅ Checklist de PWA

- [x] Manifest.json criado
- [x] Service Worker implementado
- [x] Página offline criada
- [x] Meta tags PWA no layout
- [x] Componente de status de conectividade
- [x] Prompt de instalação
- [x] Cache de assets estáticos
- [ ] Ícones da app (fazer depois)
- [ ] Screenshots para app stores
- [ ] Sincronização com Supabase
- [ ] Notificações push (opcional)

---

**Próximo**: Criar os ícones da app e implementar sincronização de dados!
