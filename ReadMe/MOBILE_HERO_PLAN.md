# خطة تصميم Hero الموبايل — DEX Marketing

---

## المشكلة الحالية

| المشكلة | السبب |
|---------|--------|
| "من هنا" يتعطل على شاشات صغيرة | `position: absolute` مع قيم ثابتة يدوية |
| الرائد الفضائي صغير جداً (240px) ومتداخل مع النص | `items-end` يضعه أسفل الصفحة تحت المحتوى |
| 160 نجمة — ثقيل على موبايل متوسط | لا يوجد تحسين للأداء |
| الـ Parallax Scroll (useScroll/useTransform) | يسبب jank على الموبايل |
| الأزرار لا تملأ العرض الكامل | `flex-row` على sm يضيّق الأزرار |

---

## المفهوم العام للتصميم الجديد

```
┌──────────────────────────────┐
│  ░░░░ نجوم خفيفة (60) ░░░░  │  ← StarField مخفف
│                              │
│   ┌────────────────────────┐ │
│   │                        │ │
│   │   🧑‍🚀  رائد فضاء       │ │  ← صورة object-contain في النصف العلوي
│   │   (النصف العلوي ~50%)  │ │     بدون opacity خافتة — واضحة وكاملة
│   │                        │ │
│   └────────────────────────┘ │
│  ░░░ gradient للدمج ░░░░░░░  │  ← fade من الصورة للخلفية
│                              │
│  ┌────────────────────────┐  │
│  │  🔶 نطلق علامتك...    │  │  ← Mission badge
│  │                        │  │
│  │  الإبداع يبدأ          │  │  ← نص أصفر (SplitText by words)
│  │  من هنا                │  │  ← نص أبيض (خط Aref Ruqaa)
│  │  ~~~~~~                │  │     + خط زخرفة SVG تحته
│  │                        │  │
│  │  ━━━━━━━                │  │  ← accent line
│  │                        │  │
│  │  وكالة تسويق رقمي...   │  │  ← Subtitle
│  │                        │  │
│  │  [  ابدأ مهمتك  🚀 ]  │  │  ← CTA رئيسي (w-full)
│  │  [ شاهد أعمالنا ✨ ]  │  │  ← CTA ثانوي (w-full)
│  └────────────────────────┘  │
│                              │
│  ↓  Scroll                   │  ← scroll indicator
└──────────────────────────────┘
```

---

## طبقات التصميم (Z-Index)

```
z-[20]  →  المحتوى النصي + الأزرار (النصف الأسفل)
z-[10]  →  Gradient من أسفل الصورة → لون الخلفية (للدمج السلس)
z-[5]   →  صورة الرائد الفضائي (block, النصف العلوي)
z-[2]   →  StarField
z-[1]   →  Radial Vignette (جوانب فقط)
z-[0]   →  خلفية شفافة (3D scene من الـ layout الأب)
```

---

## الـ Gradients المطلوبة

```
من الأعلى:         linear-gradient(to bottom, #050505/70 → transparent)       →  h-32  (فوق الصورة)
دمج الصورة-النص:   linear-gradient(to bottom, transparent 0%, #022026 100%)  →  h-40 على أسفل الصورة مباشرة
من الجانب:         radial-gradient(ellipse at center, transparent 40%, #022026/50 100%)  →  vignette خفيف
```

> **لا gradient من الأسفل** — المحتوى النصي يبدأ على خلفية صلبة `#022026` مباشرة

---

## تفاصيل صورة الرائد الفضائي

- `position: relative` — **في الـ flow الطبيعي** (ليس absolute)
- `width: 100%`, `height: ~50dvh`
- `object-fit: contain` — الصورة كاملة بدون قص
- `object-position: center bottom` — الجسم والخوذة يظهران من المنتصف
- `opacity: 1.0` — واضحة وكاملة (مش خلفية خافتة)
- `filter: brightness(1.1) contrast(1.1) saturate(1.05) drop-shadow(0 0 40px rgba(0,0,0,0.6))`
- الصورة: نفس `/images/astronaut_hero.png`
- عكس الصورة: `isAr ? scaleX(1) : scaleX(-1)` (نفس منطق الـ desktop)

**تدرج الدمج (يُوضع فوق الصورة):**
- `position: absolute bottom-0 left-0 right-0 h-40`
- `background: linear-gradient(to top, #022026 0%, transparent 100%)`
- يجعل الانتقال من الصورة للنص سلساً بدون خط فاصل

---

## الـ StarField المخفف

```typescript
// Desktop: 160 نجمة
// Mobile:   60 نجمة فقط
const STAR_COUNT = isMobile ? 60 : 160
```

---

## تسلسل الـ Animations

| العنصر | نوع الأنيميشن | delay | duration |
|--------|--------------|-------|----------|
| Mission Badge | opacity + y + blur | 0s | 0.8s |
| "الإبداع يبدأ" | SplitText by words | 0.1s/word | — |
| "من هنا" | opacity + y (spring) | 0.6s | 0.8s |
| خط الزخرفة SVG | pathLength | 1.0s | 1.2s |
| Accent Line | scaleX | 0.5s | 1.0s |
| Subtitle | opacity + y | 0.7s | 0.8s |
| CTA الرئيسي | opacity + y | 0.9s | 0.6s |
| CTA الثانوي | opacity + y | 1.0s | 0.6s |

> **لا يوجد Parallax** — `useScroll/useTransform` ممنوع على الموبايل (يسبب jank)

---

## تصميم كتلة النص

### العربية
```
الإبداع يبدأ        ← font-black, text-[2.6rem], color: #FFCC00
من هنا              ← font Aref Ruqaa, text-[2rem], color: white, rotate(-2deg)
~~~~~~              ← SVG decorative path (نفس الـ desktop)
```
> **الفرق عن الـ desktop:** لا `position: absolute` — كلاهما `display: block` في flow طبيعي

### الإنجليزية
```
Creativity Starts   ← font-black, text-[2.5rem], color: #FFCC00
From Here           ← font-black, text-[2.5rem], color: white
```

---

## تصميم الأزرار

```
[  🚀  ابدأ مهمتك  →  ]    ← w-full, py-4, rounded-2xl, bg-primary
[  ✨  شاهد أعمالنا   ]    ← w-full, py-4, rounded-2xl, border outlined
```

- الفجوة بينهم: `gap-3`
- `flex-col` دائماً (لا sm:flex-row)

---

## الملفات المطلوبة

```
src/components/landing/
├── hero-section.tsx                    ← تعديل: إضافة lg:hidden / hidden lg:block
├── hero-section-mobile.tsx             ← ملف جديد (المكوّن الكامل للموبايل)
└── effects/
    ├── hero-overlay.tsx                ← بدون تعديل
    └── hero-overlay-mobile.tsx         ← ملف جديد (المحتوى النصي للموبايل)
```

---

## تكامل الملفين في `hero-section.tsx`

```tsx
export function HeroSection() {
    return (
        <>
            {/* Desktop: lg وما فوق */}
            <div className="hidden lg:block">
                <HeroSectionDesktop />
            </div>

            {/* Mobile: أقل من lg */}
            <div className="lg:hidden">
                <HeroSectionMobile />
            </div>
        </>
    )
}
```

---

## نقاط التوافق (Breakpoints)

| الجهاز | العرض | الـ Hero المستخدم |
|--------|-------|------------------|
| iPhone SE | 375px | Mobile Hero |
| iPhone 14 Pro | 393px | Mobile Hero |
| Samsung Galaxy S24 | 412px | Mobile Hero |
| iPad Mini | 768px | Mobile Hero |
| iPad Pro | 1024px | Desktop Hero |
| Laptop | 1280px+ | Desktop Hero |

> الـ breakpoint الفاصل: `lg` = **1024px**

---

## الأداء

| العنصر | الحالي | الجديد (موبايل) |
|--------|--------|----------------|
| عدد النجوم | 160 | 60 |
| Parallax | نعم (useScroll) | لا |
| Image loading | eager | `loading="eager"` مع `fetchPriority="high"` |
| Backdrop blur | 2 عناصر | 1 عنصر فقط (Badge) |

---

## الخطوة التالية

بعد الموافقة على الخطة، يتم إنشاء:
1. `hero-section-mobile.tsx`
2. `hero-overlay-mobile.tsx`
3. تعديل `hero-section.tsx` للدمج
