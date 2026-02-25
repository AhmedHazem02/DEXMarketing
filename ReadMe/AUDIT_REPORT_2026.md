# 🔍 DEX Marketing — Full Codebase Audit Report

**Date:** February 26, 2026  
**Auditor:** GitHub Copilot (Claude Opus 4.6)  
**Focus:** Architecture & Logic, WebGL Performance, Clean Code

---

## 1. 🚨 Critical Bugs & Logic Flaws

### CRIT-1: `Astronaut.tsx` — `.clone()` called every render without disposal

**File:** `src/components/scene/Astronaut.tsx`

The `AstronautModel` component calls `scene.clone()` on every render. Each clone allocates new GPU-side geometry/material buffers that are never disposed, causing a **linear memory leak** every time the component re-renders.

```tsx
// ✅ FIX: Memoize the clone and dispose on unmount
const clonedScene = React.useMemo(() => scene.clone(), [scene])

React.useEffect(() => {
    return () => {
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose()
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose())
                } else {
                    child.material?.dispose()
                }
            }
        })
    }
}, [clonedScene])
```

---

### CRIT-2: `Hero3D.tsx` — Module-level material & color objects violate React strict mode

**File:** `src/components/scene/Hero3D.tsx` (Lines ~32-46)

`suitMaterial`, `_nebula`, `_pink`, `_blue` are **module-level mutable singletons**. In React 18+ Strict Mode (double-mount), multiple component instances share and fight over the same mutable Color objects. More critically, `suitMaterial` is never disposed.

```tsx
// ❌ REMOVE module-level mutable state:
// const suitMaterial = new THREE.MeshStandardMaterial({ ... })
// const _nebula = new THREE.Color('#c026d3')
// const _pink = new THREE.Color('#ec4899')
// const _blue = new THREE.Color('#3b82f6')

// ✅ FIX: Move into the component that uses them, with proper cleanup
function AstronautModel() {
    const suitMaterial = React.useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: new THREE.Color('#0d0d0d'),
                roughness: 0.85,
                metalness: 0.15,
            }),
        []
    )

    const scratchColors = React.useMemo(
        () => ({
            nebula: new THREE.Color('#c026d3'),
            pink: new THREE.Color('#ec4899'),
            blue: new THREE.Color('#3b82f6'),
        }),
        []
    )

    React.useEffect(() => {
        return () => {
            suitMaterial.dispose()
        }
    }, [suitMaterial])
}
```

---

### CRIT-3: Two competing landing pages render at different routes

**Files:**
- `src/app/[locale]/page.tsx` — Root landing (Hero-only / coming soon)
- `src/app/[locale]/(website)/page.tsx` — Full landing with all sections

Both routes resolve for the same locale. The root `page.tsx` shows a coming-soon hero while `(website)/page.tsx` imports the full landing with `HeroSection`, `PortfolioSection`, etc. This means:

1. **SEO confusion** — Two pages compete for the same canonical URL.
2. **Duplicate 3D scene** — The Hero 3D canvas is loaded on both pages.
3. **User confusion** — Which page does `/en` serve?

**Fix:** Delete or redirect the root page to the `(website)` route group:

```tsx
// filepath: src/app/[locale]/page.tsx
import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

export default async function RootPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    setRequestLocale(locale)
    redirect(`/${locale}/home`)
}
```

---

### CRIT-4: `usePageVisibility` hook calls `invalidate()` without guarding disposal

**File:** `src/hooks/use-page-visibility.ts`

This hook calls `useThree()` which requires it to be rendered **inside** a `<Canvas>`. If the Canvas unmounts before the visibility event fires, `invalidate()` will throw on a disposed WebGL context.

```ts
// ✅ FIX:
export function usePageVisibility() {
    const { invalidate } = useThree()
    const disposed = useRef(false)

    useEffect(() => {
        disposed.current = false
        const handleVisibility = () => {
            if (!document.hidden && !disposed.current) {
                invalidate()
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        return () => {
            disposed.current = true
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [invalidate])
}
```

---

### CRIT-5: `SceneCanvas.tsx` — DPR config is an array literal recreated every render

**File:** `src/components/scene/SceneCanvas.tsx` (Lines ~14-37)

1. **DPR array identity** — `dpr={settings.dpr as [number, number]}` creates a new array reference each render, triggering Canvas pixel-ratio recalculation.
2. **No `frameloop` property** — The Canvas runs at maximum FPS even when nothing is changing (no `demand` mode).

```tsx
// ✅ FIX: Stable config objects (no new arrays per render)
const TIER_CONFIG = {
    high:   { stars: 800, particles: 200, dpr: [1, 1.5] as [number, number], antialias: true,  post: true },
    mid:    { stars: 400, particles: 100, dpr: [1, 1]   as [number, number], antialias: false, post: true },
    low:    { stars: 150, particles: 50,  dpr: [1, 1]   as [number, number], antialias: false, post: false },
    potato: null,
} as const

// Add frameloop="demand" to Canvas
<Canvas dpr={settings.dpr} frameloop="demand" ... />
```

---

## 2. 💥 3D & Render Bottlenecks

### PERF-1: `Hero3D.tsx` — Heavy per-frame color allocations and `.set()` calls

**File:** `src/components/scene/Hero3D.tsx` (inside `AstronautModel` → `useFrame`)

The `useFrame` callback does color lerping and material updates every frame. Issues:
1. **`new THREE.Color()` inside useFrame** — Allocates garbage every frame (GC pressure).
2. **Material `.needsUpdate = true` every frame** — Forces GPU re-upload of uniforms even when nothing changed.

```tsx
// ✅ FIX: Use pre-allocated scratch objects, only update when phase changes
const _scratch = React.useMemo(() => new THREE.Color(), [])
const prevPhase = useRef<string>('')

useFrame((state) => {
    const t = state.clock.elapsedTime
    const cycle = t % CYCLE_SECS
    const phase = cycle < 5 ? 'glass' : cycle < 9 ? 'silhouette' : 'nebula'

    if (phase !== prevPhase.current) {
        prevPhase.current = phase
        switch (phase) {
            case 'glass':     _scratch.set('#3b82f6'); break
            case 'silhouette': _scratch.set('#0d0d0d'); break
            case 'nebula':    _scratch.set('#c026d3'); break
        }
        visorMaterial.color.copy(_scratch)
        visorMaterial.needsUpdate = true
    }

    if (group.current) {
        group.current.position.y = Math.sin(t * (Math.PI * 2 / FLOAT_SECS)) * FLOAT_AMP
    }

    state.invalidate()
})
```

---

### PERF-2: `Astronaut.tsx` — `useThree()` viewport read causes re-render on every resize

**File:** `src/components/scene/Astronaut.tsx` (Line ~44)

```tsx
// ❌ BAD: Full store subscription
const { viewport } = useThree()
const isTablet = viewport.width < 10 && viewport.width > 5

// ✅ FIX: Only re-render when the breakpoint actually changes
const isTablet = useThree((state) => {
    const w = state.viewport.width
    return w < 10 && w > 5
})
```

---

### PERF-3: Two separate 3D astronaut implementations exist — one may be dead code

**Files:**
- `src/components/scene/Astronaut.tsx` — Uses `/models/astronaut.glb`
- `src/components/scene/Hero3D.tsx` — Uses `/images/model.glb`

These are **two completely independent astronaut implementations** loading **different GLB files**. `SceneCanvas` imports `Astronaut`, while `Hero3D` is a standalone Canvas. If both are ever mounted, the browser downloads and parses **two separate 3D models**.

**Fix:** Consolidate into one implementation. If `Hero3D` is the newer/better version, remove the `Astronaut.tsx` + `SceneCanvas.tsx` pipeline and use `Hero3D` exclusively. Then delete the unused GLB file.

---

### PERF-4: `Hero3D.tsx` — `useGLTF.preload()` at module level is SSR-unsafe

**File:** `src/components/scene/Hero3D.tsx` (Line ~177)

```tsx
// ❌ Executes at module evaluation time — SSR-unsafe
useGLTF.preload(MODEL_PATH)

// ✅ FIX: Guard with typeof check
if (typeof window !== 'undefined') {
    useGLTF.preload(MODEL_PATH)
}
```

Same issue exists in `Astronaut.tsx` — the `try/catch` around `useGLTF.preload` masks potential SSR errors rather than solving them.

---

### PERF-5: No DRACO compression on GLB models

**Files:** `/models/astronaut.glb`, `/images/model.glb`

Neither model uses DRACO compression. For a marketing website, the GLB is likely 2-10MB uncompressed.

```bash
# ✅ Compress models offline (60-80% size reduction):
npx gltf-pipeline -i astronaut.glb -o astronaut-draco.glb -d
```

```tsx
// Then configure decoder in code:
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
```

---

## 3. 🐢 General Next.js Performance Issues

### NEXT-1: `(website)/layout.tsx` — `getSiteSettings()` blocks every page render

**File:** `src/app/[locale]/(website)/layout.tsx` (Line ~13)

```tsx
// ❌ Blocks the entire layout on every request
const settings = await getSiteSettings()

// ✅ FIX: Cache with revalidation
import { unstable_cache } from 'next/cache'

const getCachedSettings = unstable_cache(
    async () => getSiteSettings(),
    ['site-settings'],
    { revalidate: 3600 }
)

const settings = await getCachedSettings()
```

---

### NEXT-2: `(website)/layout.tsx` — inline `<script>` JSON-LD has empty contact fields

**File:** `src/app/[locale]/(website)/layout.tsx` (Lines ~18-33)

The JSON-LD Organization schema has empty `contactPoint` fields, which hurts SEO rather than helping. Either fill in real values or remove the schema.

---

### NEXT-3: Root `layout.tsx` metadata is bare-minimum — missing SEO fields

**File:** `src/app/[locale]/layout.tsx` (Lines ~30-34)

Missing: `keywords`, `openGraph`, `twitter`, `robots`, `icons`, `manifest`. For a marketing agency website this is a significant SEO gap.

```tsx
// ✅ FIX: Complete metadata
export const metadata: Metadata = {
    metadataBase: new URL('https://dex-erp.com'),
    title: {
        default: 'DEX Marketing — Digital Marketing & Content Production',
        template: '%s | DEX Marketing',
    },
    description: 'Digital marketing and content production agency...',
    keywords: ['digital marketing', 'content production', 'branding', 'web design'],
    openGraph: {
        type: 'website',
        locale: 'en_US',
        alternateLocale: 'ar_EG',
        url: 'https://dex-erp.com',
        siteName: 'DEX Marketing',
        title: 'DEX Marketing — Digital Marketing & Content Production',
        description: 'Digital marketing and content production agency',
        images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DEX Marketing',
        description: 'Digital marketing and content production agency',
        images: ['/images/og-image.png'],
    },
    robots: { index: true, follow: true },
    icons: { icon: '/favicon.ico', apple: '/images/apple-touch-icon.png' },
}
```

---

### NEXT-4: `services/page.tsx` and `about/page.tsx` are outside `(website)` route group

**Files:**
- `src/app/[locale]/services/page.tsx`
- `src/app/[locale]/about/page.tsx`

These pages manually import `<Navbar />` and `<Footer />` instead of relying on the `(website)` layout, creating a different rendering context (no `SiteSettingsProvider` wrapper).

**Fix:** Move these pages into the `(website)` route group:
```
src/app/[locale]/(website)/services/page.tsx   ← move here
src/app/[locale]/(website)/about/page.tsx      ← move here
```

Then remove the manual `<Navbar />` and `<Footer />` imports from each page.

---

### NEXT-5: Root `layout.tsx` loads 3 font families on every page

**File:** `src/app/[locale]/layout.tsx` (Line ~60)

Three web fonts (`Tajawal`, `Playfair Display`, `Space Mono`) are loaded on **every page**, including dashboard pages that only use Tajawal.

**Fix:** Move decorative fonts (`Playfair Display`, `Space Mono`) into the `(website)` layout only. Keep `Tajawal` in root.

---

## 4. 🧹 Refactoring Opportunities

### REFACTOR-1: `Hero3D.tsx` is a God Component — 300+ lines, 6 nested components

**File:** `src/components/scene/Hero3D.tsx`

Contains `AstronautModel`, `NebulaLight`, `Scene`, `MouseLight`, and `Hero3D` in a single file with shared module-level constants. Break into:

```
src/components/scene/hero3d/
├── index.tsx              ← Re-exports Hero3D
├── Hero3D.tsx             ← Outer wrapper (entrance animation + CSS glow)
├── Scene.tsx              ← Canvas contents composition
├── AstronautModel.tsx     ← Model loading + visor cycle + floating
├── MouseLight.tsx         ← Cursor-tracking light
├── NebulaLight.tsx        ← Purple point light
└── constants.ts           ← CYCLE_SECS, SWEEP_SECS, FLOAT_SECS, MODEL_PATH
```

---

### REFACTOR-2: Device capabilities hook recalculates on every mount

**File:** `src/hooks/use-device-capabilities.ts`

Device capabilities (CPU cores, RAM, WebGL support) are static — they don't change during the session. Compute **once** at module level and use `useSyncExternalStore` to serve the cached result:

```tsx
let _cached: DeviceCapabilities | null = null

function getCapabilities(): DeviceCapabilities {
    if (_cached) return _cached
    // ... compute once ...
    _cached = result
    return _cached
}

export function useDeviceCapabilities(): DeviceCapabilities {
    return useSyncExternalStore(
        () => () => {},     // subscribe (no-op, never changes)
        getCapabilities,    // getSnapshot
        () => defaultCaps   // getServerSnapshot
    )
}
```

---

### REFACTOR-3: `SceneCanvas.tsx` mixes conditional rendering with heavy imports

**File:** `src/components/scene/SceneCanvas.tsx`

Even when `tier === 'potato'` and the component returns `null`, all Three.js/R3F imports (`Canvas`, `EffectComposer`, `Bloom`, etc.) are still bundled.

**Fix:** Use `next/dynamic` to code-split the entire 3D scene:

```tsx
// SceneCanvas.tsx — thin wrapper
'use client'
import { useDeviceCapabilities } from '@/hooks/use-device-capabilities'
import dynamic from 'next/dynamic'

const SceneCanvasInner = dynamic(() => import('./SceneCanvasInner'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 z-0 bg-black" />,
})

export default function SceneCanvas() {
    const { tier } = useDeviceCapabilities()
    if (tier === 'potato') return null
    return <SceneCanvasInner tier={tier} />
}
```

---

### REFACTOR-4: `header.tsx` uses `mounted` state pattern — replace with CSS

**File:** `src/components/layout/header.tsx` (Lines ~30-31)

```tsx
// ❌ BAD: Forces an extra render cycle on every page load
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

// ✅ FIX: Use suppressHydrationWarning on the container
// and remove the mounted state entirely
```

---

## 📊 Summary

| Category | Issues | IDs |
|----------|--------|-----|
| 🚨 Critical Bugs & Logic | 5 | CRIT-1 through CRIT-5 |
| 💥 3D & Render Bottlenecks | 5 | PERF-1 through PERF-5 |
| 🐢 Next.js Performance | 5 | NEXT-1 through NEXT-5 |
| 🧹 Refactoring | 4 | REFACTOR-1 through REFACTOR-4 |
| **Total** | **19** | |

---

## 🎯 Priority Order (Recommended Fix Sequence)

| Priority | Issue | Impact |
|----------|-------|--------|
| 1 | CRIT-1 + CRIT-2 | Memory leak + shared mutable state — compound over time |
| 2 | PERF-3 | Two astronaut implementations — halve GPU/network cost |
| 3 | NEXT-1 + REFACTOR-3 | Blocking layout + bundle splitting — biggest LCP/TTI wins |
| 4 | CRIT-3 | Duplicate landing pages — SEO & UX confusion |
| 5 | PERF-5 | DRACO compression — 60-80% model size reduction |
| 6 | NEXT-3 | SEO metadata — quick win for discoverability |
| 7 | All remaining | Decreasing severity |
