# 🚀 Breath of Now - Fase 3 Implementation Files

Este pacote contém todos os ficheiros necessários para implementar a Fase 3 do ExpenseFlow.

## 📋 Checklist de Implementação

### 1. Supabase Setup (Manual)

Executa estes SQL scripts no Supabase SQL Editor **pela ordem indicada**:

1. `docs/supabase/expenseflow-schema.sql` (se ainda não executaste)
2. `docs/supabase/subscriptions-schema.sql` (novo)

### 2. Ficheiros a Copiar

Copia os ficheiros para o teu repositório, mantendo a estrutura de pastas:

```
src/
├── lib/
│   └── sync/
│       ├── index.ts        # Sync engine principal
│       ├── push.ts         # Push local → cloud
│       ├── pull.ts         # Pull cloud → local
│       ├── conflict.ts     # Resolução de conflitos
│       └── queue.ts        # Fila offline
├── hooks/
│   ├── use-sync.ts         # Hook de sincronização
│   └── use-premium.ts      # Hook de premium status
├── stores/
│   └── pricing-store.ts    # Store de subscriptions (substituir existente)
├── components/
│   ├── expenses/
│   │   ├── sync-status.tsx     # Componente de estado sync
│   │   └── expense-layout.tsx  # Layout com ads
│   ├── premium/
│   │   └── premium-gate.tsx    # Paywall component
│   └── ads/
│       └── ad-banner.tsx       # Banner de anúncios (atualizar)
└── app/[locale]/expenses/
    └── settings/
        └── page.tsx            # Settings page (atualizar)

messages/
├── sync-premium-en.json    # Merge com en.json
├── sync-premium-pt.json    # Merge com pt.json
├── settings-en.json        # Merge com en.json
└── settings-pt.json        # Merge com pt.json

docs/supabase/
└── subscriptions-schema.sql  # Novo SQL
```

### 3. Atualizar Ficheiros de Tradução

Merge os ficheiros de tradução com os existentes:

```bash
# Os novos ficheiros têm a estrutura:
# sync-premium-*.json → expenseFlow.sync.*, premium.*, ads.*
# settings-*.json → expenseFlow.nav.*, expenseFlow.settings.*
```

### 4. Atualizar Database Schema (src/lib/db/index.ts)

Adiciona o campo `syncStatus` às transações:

```typescript
// Em ExpenseTransaction interface, adiciona:
syncStatus?: 'pending' | 'synced' | 'conflict';
syncedAt?: Date;
```

### 5. Variáveis de Ambiente

Adiciona ao `.env.local` (opcional para ads):

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
```

## 🔧 Como Usar os Novos Componentes

### Sync Status
```tsx
import { SyncStatus, SyncIndicator } from '@/components/expenses/sync-status';

// Versão completa com detalhes
<SyncStatus showDetails />

// Versão compacta para header
<SyncIndicator />
```

### Premium Gate
```tsx
import { PremiumGate, PremiumBadge } from '@/components/premium/premium-gate';

// Bloquear feature premium
<PremiumGate feature="cloudSync" locale="en">
  <CloudSyncContent />
</PremiumGate>

// Badge para mostrar em items
<PremiumBadge />
```

### Hooks
```tsx
import { useSync } from '@/hooks/use-sync';
import { useIsPremium, useShowAds } from '@/hooks/use-premium';

// Sync
const { sync, status, isOnline } = useSync();

// Premium
const { isPremium, tier, canUseCloudSync } = useIsPremium();

// Ads
const showAds = useShowAds();
```

### Layout com Ads
```tsx
import { ExpenseLayout } from '@/components/expenses/expense-layout';

export default function ExpensesPage({ params: { locale } }) {
  return (
    <ExpenseLayout locale={locale}>
      {/* Conteúdo */}
    </ExpenseLayout>
  );
}
```

## 📊 Fluxo de Sync

```
1. User edita transação
   ↓
2. Dexie atualiza local (syncStatus: 'pending')
   ↓
3. Se online + autenticado + premium:
   ↓
4. Push para Supabase
   ↓
5. Atualiza syncStatus: 'synced'
```

## 🎯 Próximos Passos (Fase 4)

Depois de implementar esta fase:

1. [ ] Stripe integration para pagamentos
2. [ ] Google Drive backup
3. [ ] Import assistido com LLM
4. [ ] Family sharing
5. [ ] Export PDF

## ⚠️ Notas Importantes

1. **Ordem de execução SQL**: Sempre executa `expenseflow-schema.sql` antes de `subscriptions-schema.sql`

2. **RLS está ativo**: Os utilizadores só vêem os seus próprios dados

3. **Free tier funciona offline**: Todas as funcionalidades básicas funcionam sem conta

4. **Sync é premium**: Cloud sync requer subscrição paga

5. **Ads são placeholder**: Configura AdSense client ID para ads reais

## 🐛 Troubleshooting

### "Cannot find module '@/lib/sync'"
Verifica que copiaste a pasta `src/lib/sync/` completa

### "User not authenticated"
O utilizador precisa de fazer login para sync funcionar

### "Sync failed"
Verifica as políticas RLS no Supabase estão corretas

### Ads não aparecem
1. Verifica `NEXT_PUBLIC_ADSENSE_CLIENT_ID` está definido
2. AdSense precisa de aprovação do site
