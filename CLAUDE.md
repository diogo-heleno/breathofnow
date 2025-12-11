# Breath of Now - Claude Code Instructions

## ⚠️ IMPORTANTE - Leitura Obrigatória

Antes de iniciar QUALQUER tarefa, Claude Code DEVE ler:

1. **`.claude/RULES.md`** - Regras obrigatórias (i18n, documentação, código)
2. **`.claude/PROJECT.md`** - Contexto completo do projeto

### Comandos disponíveis (`.claude/commands/`):

- `build.md` - Build de produção
- `commit.md` - Commit de alterações
- `dev.md` - Servidor de desenvolvimento
- `lint.md` - Verificação de código
- `i18n-check.md` - Verificar texto hardcoded
- `update-docs.md` - Atualizar documentação

---

## Project Overview

Breath of Now is a privacy-first ecosystem of micro-apps for mindful living, built by M21 Global, Lda.

**Domains:**
- Website/Landing: `www.breathofnow.site`
- Apps: `app.breathofnow.site`

**Current Apps:**
- ExpenseFlow (Available) - Expense tracking with full CRUD, charts, and reports
- InvestTrack (Beta) - Investment tracking
- FitLog, StravaSync, RecipeBox, LabelScan (Coming Soon)

For detailed project documentation, see `.claude/PROJECT.md`

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Project Structure

- `src/app/[locale]/` - Pages with i18n routing (Next.js App Router)
- `src/components/ui/` - Design system components
- `src/components/layout/` - Header, Footer, etc.
- `src/lib/db/` - Dexie.js local database
- `src/lib/supabase/` - Supabase client (auth & sync)
- `src/stores/` - Zustand state management
- `messages/` - Translation files (en, pt, pt-BR, es, fr)

---

## Always Do This

- Use TypeScript strict mode - never use `any` type
- Follow existing component patterns in `src/components/ui/`
- Use `clsx` and `tailwind-merge` (via `cn()` utility) for class merging
- Keep components functional with hooks
- Use path aliases: `@/components`, `@/lib`, `@/stores`
- Write commit messages following conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Place new UI components in `src/components/ui/`
- Place new pages in `src/app/[locale]/`
- Add translations to all 5 language files in `messages/`

---

## Never Do This

- Never use `any` type - use proper TypeScript types
- Never hardcode text - always use translations via `useTranslations()`
- Never commit `.env` files or secrets
- Never use inline styles - always use Tailwind CSS
- Never create files outside the established structure
- Never skip the `[locale]` segment in page routes

---

## File Organization Rules

- **Documentation files (.md)**: Place in `docs/` directory
- **Test files**: Place in `__tests__/` directories next to source files
- **Debug scripts**: Place in `scripts/` directory
- **Generated assets**: Place in `public/` directory

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

Optional:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
```

---

## Design System

### Colors (Tailwind)
- Primary: `primary-*` (Warm Sage Green)
- Secondary: `secondary-*` (Warm Sand)
- Accent: `accent-*` (Soft Terracotta)

### Typography
- Display/Headings: `font-display` (Fraunces)
- Body: `font-sans` (Source Sans 3)
- Code: `font-mono` (JetBrains Mono)

### Component Patterns
- Buttons: Use `<Button variant="..." size="...">` from `@/components/ui`
- Cards: Use `<Card variant="...">` with CardHeader, CardContent, etc.
- Forms: Use `<Input>` with label, error, and hint props

---

## Internationalization

All user-facing text must use `next-intl`:

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('namespace');
  return <p>{t('key')}</p>;
}
```

Supported locales: `en`, `pt`, `pt-BR`, `es`, `fr`

---

## Database

### Local (Dexie.js - IndexedDB)
- All data stored locally first
- Schemas defined in `src/lib/db/index.ts`
- Use `useLiveQuery` hook for reactive queries

### Remote (Supabase - Optional)
- Only syncs when user is authenticated
- RLS (Row Level Security) required on all tables
- Client: `src/lib/supabase/client.ts`
- Server: `src/lib/supabase/server.ts`
