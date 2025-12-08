# Breath of Now - Ecosystem of Micro Apps

A collection of privacy-first micro-applications for mindful living. Built with Next.js 14, Tailwind CSS, Supabase, and IndexedDB.

**A brand of [M21 Global, Lda.](https://www.m21global.com)**

## 🌟 Features

- 🔒 **Privacy First**: All data stored locally by default (IndexedDB)
- 🌍 **Fully Localized**: Support for EN, PT, PT-BR, ES, FR
- 💰 **Fair Pricing**: Pay What You Want with regional pricing
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 🔄 **Offline First**: Works without internet connection
- 🎨 **Beautiful Design**: Custom design system with dark mode support

## 📱 Apps in the Ecosystem

| App | Description | Status |
|-----|-------------|--------|
| **ExpenseFlow** | Mindful money tracking | Available |
| **InvestTrack** | Portfolio monitoring with tax calculations | Beta |
| **FitLog** | Workout logging and progress tracking | Coming Soon |
| **StravaSync** | Enhanced Strava analytics | Coming Soon |
| **RecipeBox** | Digital cookbook with meal planning | Coming Soon |
| **LabelScan** | Food label scanning and analysis | Coming Soon |

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: IndexedDB (local) via Dexie.js
- **Auth**: Supabase Auth (Magic Link + OAuth)
- **State**: Zustand
- **i18n**: next-intl
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (for auth)
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/breathofnow.git
cd breathofnow

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📁 Project Structure

```
breathofnow/
├── messages/              # Translation files (en, pt, pt-BR, es, fr)
├── src/
│   ├── app/[locale]/      # Localized pages
│   ├── components/
│   │   ├── ui/            # Design system (Button, Input, Card, Badge)
│   │   ├── layout/        # Header, Footer
│   │   ├── brand/         # Logo
│   │   └── ads/           # Ad components
│   ├── lib/
│   │   ├── db/            # IndexedDB setup (Dexie)
│   │   ├── supabase/      # Supabase clients
│   │   └── utils.ts
│   ├── stores/            # Zustand stores
│   └── i18n.ts            # i18n configuration
└── tailwind.config.ts     # Design system tokens
```

## 🎨 Design System

### Colors
- **Primary**: Warm Sage Green (`#5a7d5a`)
- **Secondary**: Warm Sand (`#b19373`)
- **Accent**: Soft Terracotta (`#df7459`)

### Typography
- **Display**: Fraunces (serif)
- **Body**: Source Sans 3 (sans-serif)
- **Mono**: JetBrains Mono

## 💰 Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| Free | €0 | One app, with ads |
| Supporter | €3-5/mo | All apps, no ads |
| Lifetime | €29-49 | Forever + 1yr updates |

*Prices vary by region (Pay What You Want)*

## 🎯 Revenue Target: €3,000/month

- 10,000 MAU → 300 paid users (3% conversion)
- Ads: €200-400/mo
- Subscriptions: €1,500-2,000/mo
- Lifetime: €800-1,000/mo

## 📄 License

Copyright © 2024 M21 Global, Lda. All rights reserved.

## 📞 Contact

- Website: [breathofnow.site](https://breathofnow.site)
- Email: support@breathofnow.site
- Company: [M21 Global](https://www.m21global.com)
