# Supabase Database Schema - Breath of Now

> **Última atualização:** 12 Dezembro 2024  
> **Projeto:** Breath of Now (M21 Global, Lda)  
> **Total de tabelas:** 16

---

## 📋 Como Atualizar Este Documento

Quando fizeres mudanças na base de dados Supabase, segue estes passos:

### 1. Exportar Schema Atualizado

Corre esta query no **Supabase SQL Editor**:

```sql
-- QUERY PARA EXPORTAR SCHEMA COMPLETO
SELECT 
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  COALESCE(c.column_default::text, 'NULL') as column_default,
  c.ordinal_position
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'expense_transactions',
    'expense_categories',
    'expense_budgets',
    'exchange_rates',
    'import_mappings',
    'expense_settings',
    'founding_members_config',
    'user_subscriptions',
    'active_subscriptions',
    'user_app_access',
    'profiles',
    'subscription_history',
    'founding_members',
    'user_invites',
    'premium_emails',
    'subscriptions'
  )
ORDER BY c.table_name, c.ordinal_position;
```

### 2. Exportar RLS Policies

```sql
-- QUERY PARA EXPORTAR POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Exportar Foreign Keys

```sql
-- QUERY PARA EXPORTAR FOREIGN KEYS
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

### 4. Exportar Triggers e Functions

```sql
-- QUERY PARA EXPORTAR TRIGGERS
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- QUERY PARA EXPORTAR FUNCTIONS
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### 5. Atualizar este ficheiro

Depois de correres as queries acima:
1. Copia os resultados
2. Pede ao Claude Code: "Atualiza o .claude/supabase-schema.md com estes novos dados"
3. Fornece os outputs das queries
4. Claude Code atualizará as secções relevantes

---

## 📊 Schema Completo

### 1. `active_subscriptions`

**Tipo:** VIEW ou tabela materializada  
**Descrição:** Dados agregados de subscrições ativas

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | YES | NULL |
| `user_id` | uuid | YES | NULL |
| `email` | character varying | YES | NULL |
| `user_name` | text | YES | NULL |
| `tier` | character varying | YES | NULL |
| `stripe_customer_id` | character varying | YES | NULL |
| `stripe_subscription_id` | character varying | YES | NULL |
| `starts_at` | timestamp with time zone | YES | NULL |
| `expires_at` | timestamp with time zone | YES | NULL |
| `cancelled_at` | timestamp with time zone | YES | NULL |
| `is_active` | boolean | YES | NULL |
| `is_founding_member` | boolean | YES | NULL |
| `founding_member_number` | integer | YES | NULL |
| `custom_monthly_price` | numeric | YES | NULL |
| `created_at` | timestamp with time zone | YES | NULL |
| `updated_at` | timestamp with time zone | YES | NULL |

---

### 2. `exchange_rates`

**Descrição:** Taxas de câmbio para conversão de moedas

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `from_currency` | text | NO | NULL |
| `to_currency` | text | NO | NULL |
| `rate` | numeric | NO | NULL |
| `date` | date | NO | NULL |
| `created_at` | timestamp with time zone | NO | `now()` |

**Constraints:**
- Primary Key: `id`
- Unique: Provavelmente em (`from_currency`, `to_currency`, `date`)

---

### 3. `expense_budgets`

**Descrição:** Orçamentos definidos pelo utilizador para categorias

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `category_id` | uuid | YES | NULL |
| `amount` | numeric | NO | NULL |
| `period` | text | NO | NULL |
| `start_date` | date | NO | NULL |
| `is_active` | boolean | NO | `true` |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users(id)`
  - `category_id` → `expense_categories(id)`

**Valores possíveis:**
- `period`: 'monthly', 'yearly', 'quarterly', 'weekly'

---

### 4. `expense_categories`

**Descrição:** Categorias de despesas e rendimentos

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `name` | text | NO | NULL |
| `name_key` | text | YES | NULL |
| `icon` | text | NO | `'circle'::text` |
| `color` | text | NO | `'#6b7280'::text` |
| `category_type` | text | NO | NULL |
| `is_default` | boolean | NO | `false` |
| `sort_order` | integer | NO | `0` |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |
| `deleted_at` | timestamp with time zone | YES | NULL |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users(id)`

**Valores possíveis:**
- `category_type`: 'expense', 'income'

**Soft Delete:** Usa `deleted_at` para não apagar permanentemente

---

### 5. `expense_settings`

**Descrição:** Configurações do ExpenseFlow por utilizador

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `key` | text | NO | NULL |
| `value` | text | NO | NULL |
| `updated_at` | timestamp with time zone | NO | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users(id)`
- Unique: Provavelmente em (`user_id`, `key`)

**Exemplos de keys:**
- `base_currency`: 'EUR', 'USD', 'GBP'
- `default_category_expense`: uuid
- `default_category_income`: uuid

---

### 6. `expense_transactions`

**Descrição:** Transações de despesas e rendimentos

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `amount` | numeric | NO | NULL |
| `currency` | text | NO | `'EUR'::text` |
| `amount_in_base` | numeric | YES | NULL |
| `exchange_rate` | numeric | YES | NULL |
| `transaction_type` | text | NO | NULL |
| `description` | text | YES | NULL |
| `notes` | text | YES | NULL |
| `category_id` | uuid | YES | NULL |
| `date` | date | NO | NULL |
| `is_reviewed` | boolean | NO | `true` |
| `sync_status` | text | NO | `'synced'::text` |
| `import_batch_id` | uuid | YES | NULL |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |
| `deleted_at` | timestamp with time zone | YES | NULL |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users(id)`
  - `category_id` → `expense_categories(id)`

**Valores possíveis:**
- `transaction_type`: 'expense', 'income'
- `sync_status`: 'synced', 'pending', 'conflict'

**Soft Delete:** Usa `deleted_at`

---

### 7. `founding_members`

**Descrição:** Membros fundadores com acesso lifetime

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `member_number` | integer | NO | NULL |
| `display_name` | text | YES | NULL |
| `amount_paid` | numeric | YES | `599.00` |
| `invites_given` | integer | YES | `0` |
| `invites_used` | integer | YES | `0` |
| `stripe_payment_id` | text | YES | NULL |
| `show_in_hall_of_fame` | boolean | YES | `true` |
| `joined_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `profiles(id)`
- Unique: `member_number` (range: 1-100)

---

### 8. `founding_members_config`

**Descrição:** Configuração global dos founding members (singleton)

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | integer | NO | `1` |
| `total_slots` | integer | YES | `100` |
| `slots_taken` | integer | YES | `0` |
| `price_eur` | numeric | YES | `599.00` |
| `is_available` | boolean | YES | `true` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id` (sempre 1)

**Nota:** Tabela singleton - apenas 1 registo

---

### 9. `import_mappings`

**Descrição:** Mapeamentos guardados para import de CSVs

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `name` | text | NO | NULL |
| `mapping_json` | jsonb | NO | NULL |
| `date_format` | text | NO | `'YYYY-MM-DD'::text` |
| `decimal_separator` | text | NO | `'.'::text` |
| `delimiter` | text | NO | `','::text` |
| `has_header` | boolean | NO | `true` |
| `negative_is_expense` | boolean | NO | `true` |
| `use_count` | integer | NO | `0` |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `auth.users(id)`

---

### 10. `premium_emails`

**Descrição:** Whitelist de emails com acesso premium automático

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `email` | text | NO | NULL |
| `tier` | text | NO | `'pro'::text` |
| `notes` | text | YES | NULL |
| `granted_by` | text | YES | NULL |
| `created_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Unique: `email`

**Valores possíveis:**
- `tier`: 'starter', 'plus', 'pro', 'founding'

---

### 11. `profiles`

**Descrição:** Perfis de utilizadores e dados de subscrição

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | NULL |
| `email` | text | YES | NULL |
| `full_name` | text | YES | NULL |
| `avatar_url` | text | YES | NULL |
| `subscription_tier` | text | NO | `'free'::text` |
| `subscription_status` | text | YES | `'active'::text` |
| `subscription_expires_at` | timestamp with time zone | YES | NULL |
| `selected_apps` | ARRAY | YES | `'{}'::text[]` |
| `apps_selected_at` | timestamp with time zone | YES | NULL |
| `stripe_customer_id` | text | YES | NULL |
| `stripe_subscription_id` | text | YES | NULL |
| `is_founding_member` | boolean | YES | `false` |
| `founding_member_number` | integer | YES | NULL |
| `country` | text | YES | `'PT'::text` |
| `currency` | text | YES | `'EUR'::text` |
| `locale` | text | YES | `'en'::text` |
| `last_sign_in_at` | timestamp with time zone | YES | NULL |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `id` → `auth.users(id)` ON DELETE CASCADE

**Valores possíveis:**
- `subscription_tier`: 'free', 'starter', 'plus', 'pro', 'founding'
- `subscription_status`: 'active', 'cancelled', 'expired', 'past_due'

**⚠️ CRÍTICO:** A coluna chama-se `apps_selected_at`, NÃO `last_app_change`

---

### 12. `subscription_history`

**Descrição:** Histórico de mudanças de subscrição

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `user_id` | uuid | NO | NULL |
| `change_type` | text | NO | NULL |
| `previous_tier` | text | YES | NULL |
| `new_tier` | text | NO | NULL |
| `amount_paid` | numeric | YES | NULL |
| `currency` | text | YES | `'EUR'::text` |
| `stripe_payment_id` | text | YES | NULL |
| `notes` | text | YES | NULL |
| `created_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `profiles(id)`

**Valores possíveis:**
- `change_type`: 'upgrade', 'downgrade', 'renewal', 'cancellation', 'founding_join'

---

### 13. `subscriptions`

**Descrição:** Subscrições Stripe (integração futura)

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | NO | NULL |
| `tier` | text | NO | `'free'::text` |
| `status` | text | NO | `'inactive'::text` |
| `stripe_customer_id` | text | YES | NULL |
| `stripe_subscription_id` | text | YES | NULL |
| `stripe_price_id` | text | YES | NULL |
| `current_period_start` | timestamp with time zone | YES | NULL |
| `current_period_end` | timestamp with time zone | YES | NULL |
| `cancel_at_period_end` | boolean | YES | `false` |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `profiles(id)` ON DELETE CASCADE

**Valores possíveis:**
- `status`: 'active', 'inactive', 'cancelled', 'past_due', 'trialing'

---

### 14. `user_app_access`

**Tipo:** VIEW  
**Descrição:** Lógica de acesso a apps calculada por tier

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `user_id` | uuid | YES | NULL |
| `tier` | text | YES | NULL |
| `selected_apps` | ARRAY | YES | NULL |
| `is_founding_member` | boolean | YES | NULL |
| `has_full_access` | boolean | YES | NULL |
| `max_apps_selectable` | integer | YES | NULL |

**Nota:** VIEW calculada a partir de `profiles`

---

### 15. `user_invites`

**Descrição:** Sistema de convites (founding members)

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `code` | text | NO | NULL |
| `created_by` | uuid | NO | NULL |
| `invite_type` | text | NO | NULL |
| `benefit_value` | text | YES | NULL |
| `max_uses` | integer | YES | `1` |
| `times_used` | integer | YES | `0` |
| `used_by` | ARRAY | YES | `'{}'::uuid[]` |
| `is_active` | boolean | YES | `true` |
| `expires_at` | timestamp with time zone | YES | NULL |
| `created_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `created_by` → `profiles(id)`
- Unique: `code`

**Valores possíveis:**
- `invite_type`: 'founding_member', 'friend', 'promo'

---

### 16. `user_subscriptions`

**Descrição:** Gestão simplificada de subscrições

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | NO | NULL |
| `tier` | character varying | NO | `'free'::character varying` |
| `is_active` | boolean | YES | `true` |
| `stripe_customer_id` | character varying | YES | NULL |
| `stripe_subscription_id` | character varying | YES | NULL |
| `starts_at` | timestamp with time zone | YES | `now()` |
| `expires_at` | timestamp with time zone | YES | NULL |
| `cancelled_at` | timestamp with time zone | YES | NULL |
| `is_founding_member` | boolean | YES | `false` |
| `founding_member_number` | integer | YES | NULL |
| `custom_monthly_price` | numeric | YES | NULL |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `user_id` → `profiles(id)`

**Nota:** Pode ser consolidada com `subscriptions` no futuro

---

## 🔗 Diagrama de Relações

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles
    ↓
    ├── expense_transactions (1:N)
    ├── expense_categories (1:N)
    ├── expense_budgets (1:N)
    ├── expense_settings (1:N)
    ├── import_mappings (1:N)
    ├── user_subscriptions (1:N)
    ├── subscription_history (1:N)
    ├── founding_members (1:1 opcional)
    ├── user_invites (1:N)
    └── subscriptions (1:N)

founding_members_config (singleton - 1 registo)
premium_emails (whitelist independente)
exchange_rates (tabela global)
active_subscriptions (VIEW)
user_app_access (VIEW)
```

---

## 🔒 RLS Policies (Row Level Security)

### profiles

```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### expense_* tables

```sql
-- Users can only access their own data
CREATE POLICY "Users can manage their own expenses"
  ON public.expense_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Similar policies for:
-- - expense_categories
-- - expense_budgets
-- - expense_settings
-- - import_mappings
```

### premium_emails

```sql
-- No policies for regular users
-- Only service role/admin can manage
ALTER TABLE public.premium_emails ENABLE ROW LEVEL SECURITY;
```

### subscriptions

```sql
-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## ⚙️ Functions e Triggers

### handle_new_user()

**Trigger:** `on_auth_user_created` ON `auth.users`  
**Descrição:** Cria perfil automaticamente quando novo user faz signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  premium_tier TEXT;
BEGIN
  -- Check if email is in premium_emails table
  SELECT tier INTO premium_tier
  FROM public.premium_emails
  WHERE email = NEW.email;

  -- Insert profile with appropriate tier
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    subscription_tier, 
    is_founding_member
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(premium_tier, 'free'),
    COALESCE(premium_tier, '') = 'founding'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### sync_profile_subscription()

**Trigger:** `on_subscription_change` ON `subscriptions`  
**Descrição:** Sincroniza tier do Stripe para o perfil

```sql
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    subscription_tier = NEW.tier,
    subscription_expires_at = NEW.current_period_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📝 Notas Críticas

### 1. Snake_case vs camelCase

**REGRA:** Supabase usa `snake_case`, TypeScript usa `camelCase`

| ❌ Errado (TypeScript) | ✅ Correto (Supabase) | Tabela |
|------------------------|----------------------|--------|
| `lastAppChange` | `apps_selected_at` | profiles |
| `subscriptionTier` | `subscription_tier` | profiles |
| `isFoundingMember` | `is_founding_member` | profiles |
| `fullName` | `full_name` | profiles |
| `avatarUrl` | `avatar_url` | profiles |
| `selectedApps` | `selected_apps` | profiles |
| `createdAt` | `created_at` | todas |
| `updatedAt` | `updated_at` | todas |

### 2. Tabelas Duplicadas

Tens 2 tabelas similares para subscrições:
- `subscriptions` - Integração Stripe (mais técnica)
- `user_subscriptions` - Gestão interna simplificada

**Recomendação:** Consolidar numa só no futuro para evitar confusão

### 3. Views vs Tabelas

Estas são VIEWS (não tabelas físicas):
- `active_subscriptions` - Agregação de subscrições ativas
- `user_app_access` - Lógica de acesso calculada

### 4. Soft Deletes

Tabelas com soft delete (coluna `deleted_at`):
- `expense_transactions`
- `expense_categories`

**Não esquecer:** Sempre filtrar por `deleted_at IS NULL` nas queries

### 5. Singleton Tables

Tabelas com apenas 1 registo:
- `founding_members_config` (id fixo = 1)

---

## 🔍 Queries Úteis

### Ver perfil completo de um utilizador

```sql
SELECT * FROM public.profiles 
WHERE email = 'user@example.com';
```

### Ver todas as subscrições ativas

```sql
SELECT 
  p.email, 
  p.subscription_tier, 
  us.status, 
  us.expires_at
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
WHERE us.is_active = true;
```

### Ver todos os founding members

```sql
SELECT 
  p.email, 
  p.full_name, 
  fm.member_number,
  fm.joined_at
FROM public.profiles p
JOIN public.founding_members fm ON p.id = fm.user_id
WHERE p.is_founding_member = true
ORDER BY fm.member_number;
```

### Ver transações de um utilizador (últimos 30 dias)

```sql
SELECT 
  t.date,
  t.amount,
  t.currency,
  t.transaction_type,
  t.description,
  c.name as category_name
FROM public.expense_transactions t
LEFT JOIN public.expense_categories c ON t.category_id = c.id
WHERE t.user_id = 'USER_UUID_HERE'
  AND t.deleted_at IS NULL
  AND t.date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY t.date DESC;
```

### Adicionar email à whitelist premium

```sql
-- Para Pro user
INSERT INTO public.premium_emails (email, tier, notes, granted_by)
VALUES ('friend@example.com', 'pro', 'Early supporter', 'admin');

-- Para Founding Member
INSERT INTO public.premium_emails (email, tier, notes, granted_by)
VALUES ('founder@example.com', 'founding', 'Founding member #1', 'admin');
```

---

**Última verificação:** 12 Dezembro 2024  
**Versão do schema:** v1.0
