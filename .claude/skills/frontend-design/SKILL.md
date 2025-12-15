---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when building web components, pages, or applications for Breath of Now. Generates creative, polished code following the project's warm, nature-inspired aesthetic.
---

# Frontend Design Skill

Este skill guia a criação de interfaces frontend distintivas e de qualidade de produção, evitando a estética genérica de "AI slop". Implementa código real e funcional com atenção excepcional a detalhes estéticos e escolhas criativas.

## Quando Usar

Aplica este skill quando:
- Criar novos componentes UI
- Construir páginas ou layouts
- Estilizar elementos existentes
- Criar animações ou micro-interacções

## Design Thinking

Antes de codificar, compreende o contexto e compromete-te com uma direcção estética:

- **Propósito**: Que problema resolve esta interface? Quem a usa?
- **Tom**: Para Breath of Now, o tom é **orgânico/natural, warm, mindful**. Pensa: minimalismo consciente, espaço para respirar, elementos grounding.
- **Restrições**: Requisitos técnicos (Next.js 14, TypeScript, Tailwind CSS).
- **Diferenciação**: O que torna isto INESQUECÍVEL?

**CRÍTICO**: Escolhe uma direcção conceptual clara e executa-a com precisão.

## Design System Breath of Now

### Cores (SEMPRE usar estas variáveis CSS/classes Tailwind)

```css
/* Primary - Warm Sage Green */
--color-primary: #5a7d5a;
/* Classes: bg-primary, text-primary, border-primary */

/* Secondary - Warm Sand */
--color-secondary: #b19373;
/* Classes: bg-secondary, text-secondary, border-secondary */

/* Accent - Soft Terracotta */
--color-accent: #df7459;
/* Classes: bg-accent, text-accent, border-accent */

/* Neutrals - Warm grays scale 50-950 */
/* Classes: bg-neutral-50 até bg-neutral-950 */
```

### Tipografia

```tsx
// Títulos - Fraunces (serif elegante)
<h1 className="font-display text-4xl font-semibold">Título</h1>

// Corpo - Source Sans 3 (sans-serif legível)
<p className="font-body text-base">Texto corpo</p>

// Mono - JetBrains Mono (código/números)
<code className="font-mono text-sm">código</code>
```

### Animações Disponíveis

```tsx
// Fade animations
className="animate-fade-in"
className="animate-fade-in-up"
className="animate-fade-in-down"

// Scale e slide
className="animate-scale-in"
className="animate-slide-in-right"
className="animate-slide-in-left"

// Ambiance
className="animate-float"
className="animate-pulse-soft"
className="animate-shimmer"
className="animate-breathe"  // Característico do Breath of Now!
```

### Sombras

```tsx
// Soft shadows (preferidas)
className="shadow-soft-sm"
className="shadow-soft-md"
className="shadow-soft-lg"
className="shadow-soft-xl"

// Glow effects
className="shadow-glow"
className="shadow-glow-accent"
className="shadow-inner-soft"
```

## Guidelines de Estética

### ✅ FAZER

- **Tipografia**: Usar `font-display` (Fraunces) para títulos, `font-body` (Source Sans 3) para texto
- **Cores**: Paleta warm sage green, sand, e terracotta. Usar variáveis CSS.
- **Motion**: Usar classes de animação existentes. Focar em momentos de alto impacto.
- **Espaço**: Espaço negativo generoso. Breathing room. Flow orgânico.
- **Fundos**: Criar atmosfera com gradientes subtis, sombras suaves, formas orgânicas.

### ❌ EVITAR

- Fontes genéricas (Inter, Roboto, Arial, system fonts)
- Gradientes roxos em fundos brancos
- Design cookie-cutter sem carácter
- Cores hardcoded (sempre usar classes Tailwind ou variáveis CSS)
- Texto hardcoded (sempre usar traduções via `useTranslations()`)

## Componentes UI Disponíveis

Usar componentes existentes de `@/components/ui/`:

```tsx
import { Button, Input, Card, Badge } from '@/components/ui';

// Button variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="accent">Accent</Button>
<Button variant="danger">Danger</Button>

// Input
<Input label={t('email')} error={errors.email} />

// Card variants
<Card variant="default">...</Card>
<Card variant="interactive">...</Card>
<Card variant="glass">...</Card>

// Badge variants
<Badge variant="primary">Tag</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

## Padrões de Código

### Layout Responsivo

```tsx
// Mobile-first approach
<div className="px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* content */}
  </div>
</div>
```

### Container Pattern

```tsx
<main className="min-h-screen bg-neutral-50">
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* content */}
  </div>
</main>
```

### Card com Hover

```tsx
<div className="bg-white rounded-xl shadow-soft-md hover:shadow-soft-lg 
                transition-shadow duration-300 p-6">
  {/* content */}
</div>
```

## Checklist de Implementação

Antes de submeter código UI:

- [ ] Usa Fraunces para títulos, Source Sans 3 para corpo
- [ ] Usa paleta de cores do projecto (primary, secondary, accent)
- [ ] Todo o texto usa `useTranslations()` - SEM strings hardcoded
- [ ] Animações usam classes Tailwind existentes
- [ ] Design responsivo (mobile-first)
- [ ] Acessível (labels adequados, contraste, navegação por teclado)
- [ ] Sombras usam `shadow-soft-*` em vez de sombras padrão

## Exemplos de Boas Práticas

### Card de App

```tsx
const t = useTranslations('Dashboard');

<Card variant="interactive" className="group">
  <div className="flex items-center gap-4">
    <div className="p-3 rounded-xl bg-primary-100 text-primary-600
                    group-hover:bg-primary-200 transition-colors">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="font-display text-lg font-semibold text-neutral-900">
        {t('appName')}
      </h3>
      <p className="font-body text-sm text-neutral-600">
        {t('appDescription')}
      </p>
    </div>
  </div>
</Card>
```

### Hero Section

```tsx
<section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
  <div className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl 
                   font-bold text-neutral-900 animate-fade-in-up">
      {t('heroTitle')}
    </h1>
    <p className="mt-6 font-body text-xl text-neutral-600 
                  max-w-2xl animate-fade-in-up" 
       style={{ animationDelay: '100ms' }}>
      {t('heroSubtitle')}
    </p>
  </div>
</section>
```

---

**Lembra-te**: Claude é capaz de trabalho criativo extraordinário. Não te retraias - mostra o que pode ser criado quando pensamos fora da caixa e nos comprometemos totalmente com a visão Breath of Now.
