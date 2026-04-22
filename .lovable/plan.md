

## Light Theme Transformation

### What changes
Switch the entire website from a dark green/black theme to a clean, professional light theme — white/cream backgrounds with deep green accents. This keeps the forestry identity while feeling modern and approachable for government clients.

### Color palette (light version)
- **Background**: Warm white (#FAFBF7) — slight green tint
- **Foreground**: Deep charcoal (#1A2E1A)
- **Cards**: White (#FFFFFF) with subtle green-tinted borders
- **Primary**: Forest green (kept similar, slightly adjusted for contrast on light)
- **Secondary**: Light sage (#EFF5EC)
- **Muted**: Soft gray-green (#E8EDE6)
- **Borders**: Light green-gray (#D4DDD0)

### Files to update

1. **`src/index.css`** — Replace all CSS custom property values in `:root` with light-theme equivalents. Update hero-gradient, glow, text-shadow, scrollbar colors, and the `.glass` utility to work on light backgrounds.

2. **`src/components/ParticleBackground.tsx`** — Change particle color from bright green to a subtle sage/olive so they're visible but not harsh on a light background.

3. **`src/components/Navbar.tsx`** — Adjust the scrolled background from dark glass to light glass (white/cream with blur).

4. **`src/components/HeroSection.tsx`** — Update any hardcoded dark overlay gradients on the video banner to work with the light theme (lighter gradient overlay so video still shows but text remains readable).

5. **`src/components/Footer.tsx`** — Update from dark footer to a deep green footer (dark accent at the bottom provides visual grounding on a light site).

6. **`src/components/PageHero.tsx`** — Adjust overlay gradients for subpage banners.

7. **`tailwind.config.ts`** — Update the `glow-pulse` keyframe colors to match the lighter theme.

All animations, effects, and i18n remain fully intact — only the color system changes.

