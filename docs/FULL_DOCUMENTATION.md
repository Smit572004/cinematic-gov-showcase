# TinPlant – Full Technical Documentation

**Version**: 1.0  
**Last Updated**: April 2026  
**URL**: [https://tinplant.lovable.app](https://tinplant.lovable.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Security Architecture](#8-security-architecture)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Theming System](#10-theming-system)
11. [File Storage](#11-file-storage)
12. [Admin Panel](#12-admin-panel)
13. [Routing & Navigation](#13-routing--navigation)
14. [Performance Optimizations](#14-performance-optimizations)
15. [Project Structure](#15-project-structure)
16. [Environment & Configuration](#16-environment--configuration)
17. [Deployment](#17-deployment)
18. [Architecture Diagrams](#18-architecture-diagrams)

---

## 1. Project Overview

TinPlant is a bilingual (German/English) corporate website for **TinPlant Biotechnik und Pflanzenvermehrung GmbH**, a plant propagation and forestry company based in Sachsen-Anhalt, Germany.

**Key Features:**
- Public-facing corporate website with pages for products, services, research, technology, gallery, and contact
- Garden shop with seasonal promotions
- Full-featured admin panel for content management
- Bilingual support (German as default, English)
- Dark/light theme toggle
- Contact form with backend storage

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI library |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool & dev server |
| Tailwind CSS | v3 | Utility-first CSS framework |
| shadcn/ui | Latest | Pre-built accessible UI components |
| Framer Motion | Latest | Animations & transitions |
| React Router DOM | v6 | Client-side routing |
| TanStack React Query | Latest | Server state management, caching, and data fetching |

### Backend (Lovable Cloud)

| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Supabase Auth | Authentication (email/password) |
| Supabase Storage | Image/file uploads (public buckets) |
| Supabase Edge Functions (Deno) | Serverless backend logic |
| Row-Level Security (RLS) | Data access control at the database level |

---

## 3. Frontend Architecture

### Provider Hierarchy

The application wraps all components in a layered provider structure:

```
QueryClientProvider          → React Query cache & fetching
  └─ AuthProvider            → User session & admin role state
      └─ ThemeProvider       → Dark/light mode toggle
          └─ LanguageProvider → DE/EN language context
              └─ TooltipProvider → UI tooltip context
                  └─ BrowserRouter → Client-side routing
```

### Component Organization

- **Page Components** (`src/pages/`): Top-level route components. Each maps to a URL path.
- **Shared Components** (`src/components/`): Reusable sections like `Navbar`, `Footer`, `HeroSection`, `PageLayout`.
- **Admin Components** (`src/components/admin/`): Admin-specific layout and UI.
- **UI Primitives** (`src/components/ui/`): shadcn/ui components (Button, Card, Dialog, Table, etc.).

### State Management

| Type | Solution |
|---|---|
| Server state | TanStack React Query (data fetching, caching, mutations) |
| Auth state | React Context (`useAuth` hook) |
| Language state | React Context (`useLanguage` hook) |
| Theme state | React Context (`useTheme` hook) with `localStorage` persistence |
| Local UI state | React `useState` / `useReducer` |

### Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| `useAuth` | `src/hooks/useAuth.tsx` | Provides `user`, `session`, `isAdmin`, `signIn`, `signUp`, `signOut` |
| `useLanguage` | `src/i18n/LanguageContext.tsx` | Provides `lang`, `setLang`, `t()` translation function |
| `useScrollAnimation` | `src/hooks/useScrollAnimation.ts` | Intersection Observer-based scroll reveal animations |
| `useGardenShopStatus` | `src/hooks/useGardenShopStatus.ts` | Checks garden shop open/closed status |
| `useMobile` | `src/hooks/use-mobile.tsx` | Responsive breakpoint detection |

---

## 4. Backend Architecture

### Overview

The backend runs on **Lovable Cloud** (powered by Supabase), providing:

1. **PostgreSQL Database** – 8 tables with full RLS
2. **Authentication** – Email/password sign-in via Supabase Auth
3. **Edge Functions** – 2 serverless Deno functions
4. **Storage** – 2 public buckets for images

### Edge Functions

#### `setup-admin` (POST)

- **Purpose**: Bootstrap the first admin user
- **Auth**: Requires JWT Bearer token
- **Logic**:
  1. Validates the JWT and extracts user identity
  2. Checks if any admin role exists in `user_roles`
  3. If no admin exists → inserts the requesting user as `admin`
  4. If admin already exists → returns `403 Forbidden`
- **Security**: Can only be called once (first-admin-only pattern)

#### `translate` (POST)

- **Purpose**: Dictionary-based German → English translation
- **Auth**: None required (public)
- **Input**: `{ "texts": ["Eiche", "Buche", "Geschäftsführer"] }`
- **Output**: `{ "translations": ["Oak", "Beech", "Managing Director"] }`
- **Logic**: Uses a built-in dictionary of ~100 forestry/garden/role terms. Falls back to word-by-word replacement for multi-word inputs. Returns original text if no translation found.
- **Use case**: Admin panel auto-translates German content to English

---

## 5. Database Schema

### Tables Overview

| Table | Columns | Purpose |
|---|---|---|
| `products` | `id`, `name_de`, `name_en`, `species`, `category`, `container_size`, `price`, `availability`, `image_url`, `description_de`, `description_en`, `created_at`, `updated_at` | Plant/tree product catalog |
| `gallery_images` | `id`, `title_de`, `title_en`, `category`, `image_url`, `is_active`, `sort_order`, `created_at`, `updated_at` | Photo gallery entries |
| `garden_offers` | `id`, `title_de`, `title_en`, `description_de`, `description_en`, `badge_de`, `badge_en`, `icon`, `is_active`, `sort_order`, `created_at`, `updated_at` | Seasonal garden shop promotions |
| `team_members` | `id`, `name`, `role_de`, `role_en`, `email`, `phone`, `sort_order`, `created_at` | Staff directory |
| `site_content` | `id`, `content_key`, `value_de`, `value_en`, `updated_at` | Key-value CMS content |
| `contact_submissions` | `id`, `full_name`, `email`, `phone`, `organization`, `subject`, `message`, `created_at` | Contact form entries |
| `profiles` | `id`, `user_id`, `display_name`, `avatar_url`, `created_at`, `updated_at` | User profile data |
| `user_roles` | `id`, `user_id`, `role` (enum: `admin` \| `user`) | Role assignments |

### Enums

- **`app_role`**: `'admin'` | `'user'`

### Database Functions

| Function | Type | Purpose |
|---|---|---|
| `has_role(_user_id uuid, _role app_role)` | `SECURITY DEFINER` | Checks if a user has a specific role. Prevents RLS recursion. Only allows checking own role or admin checking others. |
| `handle_new_user()` | `TRIGGER` function | Auto-creates a `profiles` row when a new user signs up via Supabase Auth |

### Relationships

- `profiles.user_id` → `auth.users.id` (auto-created via trigger)
- `user_roles.user_id` → `auth.users.id`

---

## 6. API Reference

### Supabase Client Queries (Frontend)

All data access uses the Supabase JS client (`@supabase/supabase-js`):

```typescript
import { supabase } from "@/integrations/supabase/client";
```

#### Public Data (no auth required)

| Operation | Code Example |
|---|---|
| Fetch products | `supabase.from("products").select("*")` |
| Fetch active gallery | `supabase.from("gallery_images").select("*").eq("is_active", true).order("sort_order")` |
| Fetch active offers | `supabase.from("garden_offers").select("*").eq("is_active", true).order("sort_order")` |
| Fetch team | `supabase.from("team_members").select("*").order("sort_order")` |
| Fetch site content | `supabase.from("site_content").select("*")` |
| Submit contact form | `supabase.from("contact_submissions").insert({ full_name, email, message, ... })` |

#### Admin Operations (requires admin role)

| Operation | Code Example |
|---|---|
| Create product | `supabase.from("products").insert({ name_de, name_en, species, ... })` |
| Update product | `supabase.from("products").update({ ... }).eq("id", productId)` |
| Delete product | `supabase.from("products").delete().eq("id", productId)` |
| Upload image | `supabase.storage.from("product-images").upload(path, file)` |
| Get public URL | `supabase.storage.from("product-images").getPublicUrl(path)` |

#### Auth Operations

| Operation | Code Example |
|---|---|
| Sign in | `supabase.auth.signInWithPassword({ email, password })` |
| Sign up | `supabase.auth.signUp({ email, password })` |
| Sign out | `supabase.auth.signOut()` |
| Check admin role | `supabase.rpc("has_role", { _user_id: userId, _role: "admin" })` |
| Listen to auth | `supabase.auth.onAuthStateChange(callback)` |

#### Edge Function Calls

| Function | Code Example |
|---|---|
| Setup admin | `supabase.functions.invoke("setup-admin")` |
| Translate text | `supabase.functions.invoke("translate", { body: { texts: ["Eiche"] } })` |

---

## 7. Authentication & Authorization

### Auth Flow

1. User navigates to `/admin/login`
2. Enters email + password
3. `supabase.auth.signInWithPassword()` validates credentials
4. On success → JWT token stored in `localStorage`
5. `AuthProvider` listens to `onAuthStateChange` and updates context
6. `has_role` RPC checks if user has `admin` role in `user_roles` table
7. `isAdmin` state determines access to admin pages

### First Admin Bootstrap

1. First user signs up and confirms email
2. Navigates to admin and triggers `setup-admin` edge function
3. Function verifies JWT, checks no admin exists, grants admin role
4. Subsequent calls to `setup-admin` return `403`

### Role Model

| Role | Capabilities |
|---|---|
| Anonymous | Read public content, submit contact forms |
| Authenticated (user) | Same as anonymous + manage own profile |
| Admin | Full CRUD on all content tables, manage gallery/products/team/offers |

---

## 8. Security Architecture

### Row-Level Security (RLS)

All 8 tables have RLS **enabled**. Policies:

| Table | Anonymous | Authenticated | Admin |
|---|---|---|---|
| `products` | SELECT all | SELECT all | SELECT, INSERT, UPDATE, DELETE |
| `gallery_images` | SELECT active | SELECT active | SELECT all, INSERT, UPDATE, DELETE |
| `garden_offers` | SELECT active | SELECT active | SELECT all, INSERT, UPDATE, DELETE |
| `team_members` | SELECT all | SELECT all | SELECT, INSERT, UPDATE, DELETE |
| `site_content` | SELECT all | SELECT all | SELECT, INSERT, UPDATE |
| `contact_submissions` | INSERT only | INSERT only | – (read via backend only) |
| `profiles` | – | Own row only (SELECT, UPDATE, INSERT) | – |
| `user_roles` | – | – | SELECT, INSERT, DELETE |

### Security Design Decisions

1. **Roles stored in separate table** (`user_roles`), never on `profiles` or `auth.users` metadata → prevents privilege escalation
2. **`has_role()` is `SECURITY DEFINER`** → executes with elevated privileges to avoid RLS recursion
3. **Role enumeration prevention** → `has_role()` only allows:
   - Checking your own role
   - Admins checking any user's role
   - Returns `false` for unauthorized checks (no error leakage)
4. **Contact submissions** → INSERT-only policy, no client-side reads (prevents data harvesting)
5. **Active-only filtering** → `gallery_images` and `garden_offers` only show `is_active = true` to non-admins
6. **No raw SQL execution** → All queries use typed Supabase client APIs
7. **JWT validation in edge functions** → `setup-admin` verifies Bearer token server-side
8. **CORS headers** → Applied to all edge function responses
9. **Storage buckets are public** → Images are publicly accessible (intentional for a corporate site)
10. **Auto-generated files are read-only** → `client.ts`, `types.ts`, `.env` are never manually edited

---

## 9. Internationalization (i18n)

### Implementation

- **Context**: `LanguageContext` provides `lang`, `setLang`, and `t()` globally
- **Translation source**: Static dictionary in `src/i18n/translations.ts`
- **Persistence**: Language preference stored in `localStorage` (`tinplant-lang`)
- **Default**: German (`de`)

### How Translations Work

**Static UI text**: Uses `t("key")` function that looks up the key in the translations dictionary:
```tsx
const { t } = useLanguage();
<h1>{t("hero.title")}</h1>
```

**Database content**: All content tables have `_de` and `_en` column pairs:
```
name_de: "Eiche"    → name_en: "Oak"
title_de: "Galerie"  → title_en: "Gallery"
```

**Admin auto-translation**: When an admin enters German text, the `translate` edge function provides English translations using a domain-specific dictionary (~100 terms covering forestry, gardening, and company roles).

---

## 10. Theming System

### Design Tokens (CSS Custom Properties)

All colors are defined as HSL values in `src/index.css`:

**Light Mode** (`:root`):
| Token | HSL Value | Description |
|---|---|---|
| `--background` | `140 18% 95%` | Light sage background |
| `--foreground` | `150 30% 12%` | Dark forest text |
| `--primary` | `145 45% 28%` | Deep green accent |
| `--secondary` | `140 20% 90%` | Light green surface |
| `--muted` | `140 12% 88%` | Muted background |
| `--destructive` | `0 84.2% 60.2%` | Error red |

**Dark Mode** (`.dark`):
| Token | HSL Value | Description |
|---|---|---|
| `--background` | `150 10% 7%` | Deep forest background |
| `--foreground` | `60 20% 95%` | Warm light text |
| `--primary` | `145 45% 35%` | Brighter green |

### Theme Toggle

- `ThemeProvider` in `src/i18n/ThemeContext.tsx`
- Persisted via `localStorage`
- Default: **Dark mode**
- Toggle component: `ThemeToggle` (sun/moon icon in navbar)

### Design Rules

- **Never use hardcoded colors** in components (e.g., `text-white`, `bg-black`)
- Always use semantic tokens: `bg-background`, `text-foreground`, `border-border`, etc.
- All custom colors must be added to `tailwind.config.ts`

---

## 11. File Storage

### Buckets

| Bucket | Public | Purpose | Upload Method |
|---|---|---|---|
| `product-images` | ✅ Yes | Product catalog photos | Admin panel upload form |
| `gallery-images` | ✅ Yes | Gallery page photos | Admin panel upload form |

### Upload Flow

1. Admin selects image in upload form
2. Frontend calls `supabase.storage.from("bucket-name").upload(path, file)`
3. On success, retrieves public URL via `getPublicUrl(path)`
4. Stores the URL in the corresponding table column (`image_url`)
5. Images are served directly from the public bucket URL

---

## 12. Admin Panel

### Access

- **URL**: `/admin/login` → `/admin`
- **Protection**: `useAuth()` hook checks `isAdmin` before rendering admin content
- **First Setup**: `setup-admin` edge function (one-time bootstrap)

### Admin Routes

| Route | Page | Manages |
|---|---|---|
| `/admin` | Dashboard | Overview statistics (product count, team count, etc.) |
| `/admin/products` | Products | Full CRUD for plant catalog with image upload |
| `/admin/team` | Team | Manage staff members with role translations |
| `/admin/content` | Content | Edit CMS key-value pairs (site text) |
| `/admin/offers` | Offers | Garden shop promotions with badges and icons |
| `/admin/gallery` | Gallery | Photo gallery with categories and sort order |

### Admin Features

- **Bilingual editing**: All content forms have DE and EN fields
- **Auto-translation**: German → English via `translate` edge function
- **Image uploads**: Direct to Supabase storage buckets
- **Breadcrumb navigation**: Context-aware breadcrumbs in admin layout
- **Responsive sidebar**: Collapsible admin navigation
- **Animated stat cards**: Dashboard overview with Framer Motion

---

## 13. Routing & Navigation

### Public Routes

| Path | Page | Description |
|---|---|---|
| `/` | Home | Hero section, about preview, services, impact stats |
| `/about` | About | Company history and mission |
| `/technology` | Technology | Plant propagation technology |
| `/services` | Services | Service offerings |
| `/research` | Research | R&D projects |
| `/gallery` | Gallery | Photo gallery (active images only) |
| `/products` | Products | Full product catalog |
| `/contact` | Contact | Contact form |
| `/garden-shop` | Garden Shop | Seasonal offers and promotions |
| `*` | 404 | Not Found page |

### Admin Routes

| Path | Access | Page |
|---|---|---|
| `/admin/login` | Public | Admin login form |
| `/admin` | Admin only | Dashboard |
| `/admin/products` | Admin only | Product management |
| `/admin/team` | Admin only | Team management |
| `/admin/content` | Admin only | Content management |
| `/admin/offers` | Admin only | Offers management |
| `/admin/gallery` | Admin only | Gallery management |

### Navigation Structure

- **Centered nav links**: Home, About, Gallery, Products
- **Expertise dropdown**: Technology, Services, Research
- **Right utilities**: Language switcher, Theme toggle, Admin shield icon
- **Mobile**: Hamburger menu with full navigation

---

## 14. Performance Optimizations

| Optimization | Implementation |
|---|---|
| **Lazy loading** | All routes except Home are lazy-loaded via `React.lazy()` + `Suspense` |
| **Code splitting** | Vite automatically splits chunks per route |
| **React Query caching** | Server data cached and deduplicated |
| **Image optimization** | Images served from CDN-backed storage buckets |
| **CSS efficiency** | Tailwind CSS purges unused styles in production |
| **Minimal bundle** | shadcn/ui components are tree-shakeable (only imported ones are bundled) |

---

## 15. Project Structure

```
tinplant/
├── docs/                           # Architecture diagrams (Mermaid .mmd files)
│   ├── 01_Application_Architecture.mmd
│   ├── 02_Database_Schema.mmd
│   ├── 03_Authentication_Flow.mmd
│   ├── 04_Data_Flow_and_RLS.mmd
│   ├── 05_Admin_Workflow.mmd
│   └── 06_Technology_Stack.mmd
├── public/                         # Static assets served directly
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/                     # Static images, videos
│   ├── components/
│   │   ├── admin/                  # Admin layout (AdminLayout.tsx)
│   │   ├── ui/                     # ~40 shadcn/ui primitives
│   │   ├── Navbar.tsx              # Main navigation bar
│   │   ├── Footer.tsx              # Site footer
│   │   ├── HeroSection.tsx         # Homepage hero with video
│   │   ├── AboutSection.tsx        # About preview
│   │   ├── ServicesSection.tsx     # Services grid
│   │   ├── ImpactSection.tsx       # Statistics counters
│   │   ├── ContactSection.tsx      # Contact form
│   │   ├── WhyChooseUs.tsx         # USP section
│   │   ├── GardenShopBanner.tsx    # Garden shop CTA
│   │   ├── PageLayout.tsx          # Shared page wrapper
│   │   ├── PageHero.tsx            # Subpage hero banners
│   │   ├── ParticleBackground.tsx  # Animated particle effect
│   │   ├── LanguageSwitcher.tsx    # DE/EN toggle
│   │   ├── ThemeToggle.tsx         # Dark/light toggle
│   │   └── NavLink.tsx             # Navigation link component
│   ├── hooks/
│   │   ├── useAuth.tsx             # Auth context & provider
│   │   ├── useScrollAnimation.ts   # Scroll-reveal animations
│   │   ├── useGardenShopStatus.ts  # Shop open/closed check
│   │   └── use-mobile.tsx          # Mobile breakpoint detection
│   ├── i18n/
│   │   ├── LanguageContext.tsx      # Language provider
│   │   ├── ThemeContext.tsx         # Theme provider
│   │   └── translations.ts         # Static translation dictionary
│   ├── integrations/supabase/
│   │   ├── client.ts               # ⚠️ AUTO-GENERATED – DO NOT EDIT
│   │   └── types.ts                # ⚠️ AUTO-GENERATED – DO NOT EDIT
│   ├── lib/
│   │   └── utils.ts                # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── admin/                  # Admin pages (6 pages)
│   │   ├── Index.tsx               # Homepage
│   │   ├── AboutPage.tsx
│   │   ├── TechnologyPage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── ResearchPage.tsx
│   │   ├── GalleryPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── GardenShopPage.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx                     # Root component (providers + routes)
│   ├── App.css                     # App-level styles
│   ├── index.css                   # Design tokens & Tailwind config
│   └── main.tsx                    # Entry point
├── supabase/
│   ├── config.toml                 # ⚠️ AUTO-MANAGED
│   ├── functions/
│   │   ├── setup-admin/index.ts    # First-admin bootstrap
│   │   └── translate/index.ts      # DE→EN dictionary translation
│   └── migrations/                 # Database migrations (auto-managed)
├── .env                            # ⚠️ AUTO-GENERATED – DO NOT EDIT
├── index.html                      # HTML entry point
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 16. Environment & Configuration

### Auto-Generated Files (DO NOT EDIT)

| File | Purpose |
|---|---|
| `.env` | Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) |
| `src/integrations/supabase/client.ts` | Supabase JS client initialization |
| `src/integrations/supabase/types.ts` | TypeScript types generated from database schema |
| `supabase/config.toml` | Supabase project configuration |

### Backend Secrets (Edge Functions)

| Secret | Used By |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `setup-admin` (elevated DB access) |
| `SUPABASE_URL` | Edge functions (API base URL) |
| `SUPABASE_ANON_KEY` | Edge functions |
| `LOVABLE_API_KEY` | Lovable Cloud internal |

---

## 17. Deployment

- **Platform**: Lovable Cloud (automatic builds & deploys)
- **Published URL**: [https://tinplant.lovable.app](https://tinplant.lovable.app)
- **Edge Functions**: Auto-deployed on push
- **Database Migrations**: Managed via Lovable Cloud migration tool
- **No manual CI/CD required** – all changes deploy automatically

---

## 18. Architecture Diagrams

Visual diagrams are available in the `docs/` directory as Mermaid (`.mmd`) files:

| # | Diagram | File |
|---|---|---|
| 1 | Application Architecture | `docs/01_Application_Architecture.mmd` |
| 2 | Database Schema (ER Diagram) | `docs/02_Database_Schema.mmd` |
| 3 | Authentication Flow | `docs/03_Authentication_Flow.mmd` |
| 4 | Data Flow & RLS Policies | `docs/04_Data_Flow_and_RLS.mmd` |
| 5 | Admin Workflow | `docs/05_Admin_Workflow.mmd` |
| 6 | Technology Stack | `docs/06_Technology_Stack.mmd` |

**View Options:**
- GitHub renders `.mmd` files natively
- Use [mermaid.live](https://mermaid.live) for interactive viewing
- VS Code with "Mermaid Preview" extension

---

*© TinPlant Biotechnik und Pflanzenvermehrung GmbH. All rights reserved.*
