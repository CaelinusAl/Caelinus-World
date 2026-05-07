# CAELINUS AI — Project Memory

> **Single source of truth** for what Caelinus AI is, why it exists, and how it is architected.
> Anyone (human or AI agent) returning to this codebase should read this file FIRST.

---

## 1. Founder Vision

**Caelinus AI** is **NOT** a normal fashion site. It is an AI-powered digital fashion + avatar + symbolic experience platform.

Users enter Caelinus AI and:

- create or select avatars
- try outfits digitally on those avatars
- explore fashion archetypes
- interact with cinematic AI scenes
- experience storytelling, aesthetics, and identity transformation

### Visual Language

- **Aesthetic:** luxury futuristic, sacred feminine + futuristic runway + AI hologram mood
- **Palette:** black `#0a0806` / gold `#caa56a` / nude `#d4ad8a` / ivory `#f4e7d0` / deep burgundy
- **Lighting:** soft cinematic, editorial fashion energy
- **Typography:** serif (Cormorant Garamond) for editorial titles, geometric sans for kickers/labels
- **Glyphs:** `✦` (signature), `❍` (water), `◌` (air), `☷` (earth)

### Brand Ecosystem

**CR YAPIM** and **Caelinus AI** are connected creative brands. The full ecosystem covers:

- fashion
- AI avatars
- digital storytelling
- cinematic content production
- Bosphorus studio aesthetics
- editorial visuals
- symbolic luxury branding

---

## 2. MVP Scope

**Goal:** First MVP of the Caelinus Avatar + Try-On + Shop system.

### MVP Flow

1. User enters `/caelinus-ai/avatar`
2. Uploads selfie OR selects style profile
3. System runs AI-style analysis with cinematic progress states
4. AI returns 6 archetype matches; one is `✦ Senin için`
5. User selects a match → finalized avatar
6. User enters `/caelinus-ai/try-on` to swap outfits on the avatar
7. User can rotate/preview looks in 3D
8. User clicks **"Satın Al"** → routed to `/caelinus-ai/shop` (or `/universe/shop` for legacy checkout)

### MVP Rule

- **Use uploaded GLB avatars first** — no real generative AI yet
- Mock providers + preset assets handle everything end-to-end
- The architecture is provider-pluggable, so when a real backend appears (Caelinus AI Studio, Stability, custom pipeline) it slots in without UI changes
- **DO NOT depend fully on Avaturn.** Caelinus owns its avatar architecture.

### Future System (post-MVP)

- QR code phone selfie capture (`/caelinus-ai/avatar/m` already exists as the placeholder)
- real face analysis pipeline
- AI avatar generation (Caelinus-owned model or third-party slot)
- real cloth simulation (vs. today's "illusion" via lighting + variant meshes)
- animation/motion system

---

## 3. Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| 3D | Three.js + React Three Fiber + drei |
| Styling | Tailwind v4 + custom CSS modules under `app/caelinus-ai/caelinus-ai.css` |
| Motion | Framer Motion (where useful) + CSS keyframes for the cinematic palette |
| State | React hooks + zustand (for shop/cart) |
| Storage | localStorage (style profile, generated avatar, cart) + IndexedDB (selfie blob) |
| Face / AI | MediaPipe Tasks Vision (real face landmarks) + heuristic pixel sampling |
| Backend (auth/db) | Supabase (existing) |
| Payments | Stripe (existing) |

---

## 4. Pages

| Route | Purpose |
|---|---|
| `/caelinus-ai/avatar` | Selfie + Style → AI Match Grid → Finalized 3D avatar with `ReadingCard` |
| `/caelinus-ai/try-on` | Avatar + product variants — outfit illusion with try-on aura, mood banner, variant meshes |
| `/caelinus-ai/shop` | **Luxury bütik** — sticky avatar scene + `AvatarCarousel` body picker + product grid + floating cart bar → checkout |

All three pages share `app/caelinus-ai/layout.tsx` (header + footer + bg shell) and `caelinus-ai.css` (~2.5k lines of bespoke palette).

---

## 5. Folder Structure

```
caelinus/
├── app/
│   └── caelinus-ai/
│       ├── layout.tsx              # cinematic shell + nav (Avatar / Try-on / Bütik / Universe)
│       ├── caelinus-ai.css         # the entire visual language
│       ├── avatar/page.tsx         # selfie + style + match grid + finalize
│       ├── try-on/page.tsx         # outfit swapping illusion
│       └── shop/page.tsx           # bütik (sticky avatar + product grid + cart bar)
├── components/caelinus-ai/
│   ├── AvatarCarousel.tsx          # reusable body picker (cards / thumbs)
│   ├── AvatarMatchGrid.tsx         # 6-archetype match grid
│   ├── Caelinus3DScene.tsx         # the 3D canvas (try-on aura, swap veil, glow rim)
│   ├── LuxButton.tsx               # gold / nude / ghost luxury button
│   ├── ReadingCard.tsx             # Caelinus reading (Identity + Energy + Mood + Paragraph)
│   ├── SelfieCapture.tsx           # webcam + upload selfie
│   ├── StyleCustomizer.tsx         # hair / skin / face / body / outfit mood
│   └── TryOnProductCard.tsx        # try-on side product card
├── lib/caelinus-ai/
│   ├── index.ts                    # public surface — UI imports ONLY from here
│   ├── types.ts                    # the contract: SelfieInput, AvatarStyleProfile, AvatarMatch, GeneratedAvatar, CaelinusReading, etc.
│   ├── provider.ts                 # AvatarProvider interface + registry (active provider)
│   ├── providers/mock.ts           # MOCK provider — MediaPipe + body library + 6 archetypes
│   ├── storage.ts                  # localStorage + IndexedDB (style, avatar, selfie)
│   └── try-on-variants.ts          # 9 selin*.glb variants — deterministic per-product mapping
├── lib/avatar-bodies.ts            # CAELINUS_BODY_LIBRARY — the canonical body registry
└── public/
    ├── avatars/manifest.json       # canonical avatar registry (mirrors lib/avatar-bodies.ts)
    ├── outfits/manifest.json       # canonical outfit/garment registry (mirrors data/products.ts → OUTFIT_GLB_MAP)
    ├── products/                   # zodiac-organized product imagery (legacy, still in use)
    └── models/                     # all GLB files live here for now (caelinus-avatar*.glb, selin*.glb, Meshy_Al/*.glb, catwalk.glb)
```

**Convention note:** the founder vision references `public/avatars/`, `public/outfits/`, `public/products/` as the canonical layout. The actual GLB files currently live under `public/models/` for historical reasons; the manifests under `public/avatars/` and `public/outfits/` are the source-of-truth registry. **When a new GLB asset is added, drop it under `public/models/` AND add it to the matching manifest.**

---

## 6. The Provider Contract

The single most important architectural concept. UI never knows whether AI is real or mocked.

```ts
// lib/caelinus-ai/provider.ts
export interface AvatarProvider {
  readonly id: string;                // "mock", "caelinus-ai-studio", "stability"
  readonly label: string;
  readonly version: string;
  readonly supportsSelfie: boolean;
  readonly estimatedLatencyMs: number;

  analyzeSelfie?(selfie: SelfieInput): Promise<SelfieAnalysis>;
  generate(input: GenerateInput): Promise<GeneratedAvatar>;
  generateMatches?(input: GenerateInput): Promise<AvatarMatch[]>;
  finalizeMatch?(input: { match, selfie?, onProgress?, signal? }): Promise<GeneratedAvatar>;
}
```

When a real backend ships, register it: `registerProvider(myProvider)` and either let env (`NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER`) pick it, or call `setActiveProvider("id")`.

UI calls `getActiveProvider()` and never imports a specific provider.

---

## 7. Key Data Models

```ts
// What the user inputs
SelfieInput { dataUrl, source: "upload" | "webcam", capturedAt, width?, height? }

AvatarStyleProfile {
  hair: { length, texture, color },
  skinTone, faceStyle, bodyType, outfitMood, frequencyTag?
}

// What the AI returns
SelfieAnalysis { detected, faceShape, estimatedSkinTone, estimatedHairColor, ... }

// 6 archetype cards
AvatarMatch {
  id, glbUrl, thumbnailUrl?, styleProfile, reading: CaelinusReading,
  recommendationScore: 0-100, isRecommended?, sourceBodyId?
}

// Final selection
GeneratedAvatar {
  id, glbUrl, thumbnailUrl?, analysis?, styleProfile,
  provider, generatedAt, reading?, caelinusReading?, matchId?,
  outfitBindingHints? { bindingScale, supportsSkinToneOverride, isPhotorealistic }
}

// Caelinus reading (poetry layer)
CaelinusReading {
  styleIdentity { id, label, subtitle? },
  energy: "fire" | "water" | "air" | "earth",
  mood,                                         // single italic line
  reading,                                      // longer paragraph
  frequencyTag                                  // "Auteur · 528 Hz"
}
```

---

## 8. The Six Archetypes

The mock provider returns exactly 6 archetypes per selfie + style combination. They are the soul of the brand:

| Archetype | Energy | Mood |
|---|---|---|
| **Goddess Minimal** — *ICONOGRAPHIC · CRYSTALLINE* | air | "Az dokuda çok niyet — sessizliğin formdaki hâli." |
| **Lunar Auteur** — *NIGHT · INK · INTERIOR* | water | "Aydan akarak geliyorsun." |
| **Solar Couture** — *GOLD · ATELIER · CEREMONIAL* | fire | "Yangının zarafetinde duruyorsun." |
| **Earth Veil** — *BOHEMIAN · TERRACOTTA · ROOTED* | earth | "Toprağın sabrını giyiniyorsun." |
| **Futurist Oracle** — *METALLIC · GLITCH · PROPHETIC* | air | "Geleceğin sesini bugünden duyuyorsun." |
| **Ritual Flame** — *TEMPLE · GLOW · INITIATION* | fire | "Her parçan bir geçit." |

These live in `lib/caelinus-ai/providers/mock.ts → ARCHETYPES`. Edit cautiously — they map to body library preferences and recommendation scoring.

---

## 9. The Try-On Illusion (no real cloth simulation yet)

Because we don't run real cloth simulation in the MVP, we sell the illusion via:

1. **Variant meshes** — `lib/caelinus-ai/try-on-variants.ts` has 9 `selin*.glb` body silhouettes. Each product deterministically maps to one variant via a stable hash of `productId + zodiac`. Same product = same silhouette every time.
2. **Try-on aura** — `Caelinus3DScene` accepts `tryOnAccent` (color) + `tryOnLabel`. The product's element color (fire / water / air / earth) drives a conic-gradient rim, an extra `pointLight`, and a fade-in `Bedeninde · {product}` tag.
3. **Swap veil** — when the GLB URL changes, a 700ms shimmer overlay reads `✦ Caelinus seni yeniden örüyor…` so the load feels intentional.
4. **Mood banner** — for each product, a single italic line is pulled from the element-specific mood pool.

This "feels expensive" without paying the cloth-sim cost.

---

## 10. Storage Surface

| Key | Where | What |
|---|---|---|
| `caelinus_ai_style_profile` | localStorage | `AvatarStyleProfile` |
| `caelinus_ai_generated_avatar` | localStorage | `GeneratedAvatar` (single active avatar) |
| `caelinus_ai_cart` | localStorage | `Array<{ productId, addedAt, avatarId? }>` (shop page) |
| `caelinus-ai-selfie` (DB) → `selfies` (store) → `current` | IndexedDB | `SelfieInput` (raw blob, doesn't pollute localStorage) |

A `storage` event is dispatched manually when the avatar is written, so other tabs / sibling components rehydrate.

---

## 11. CSS Naming

All Caelinus AI styles use the `cai-` prefix and live in `app/caelinus-ai/caelinus-ai.css` (single bundle, page-scoped via the layout import). Major namespaces:

- `.cai-shell` (layout shell), `.cai-header`, `.cai-footer`
- `.cai-hero`, `.cai-stepper`, `.cai-page`, `.cai-fade-in`, `.cai-fade-up`
- `.cai-avatar-grid`, `.cai-match-grid`, `.cai-match-card`, `.cai-match-card.is-recommended`
- `.cai-reading-card`, `.cai-reading-card-energy`
- `.cai-canvas`, `.cai-canvas-rim`, `.cai-canvas-tryon-tag`, `.cai-canvas-swap-veil`
- `.cai-tryon-layout`, `.cai-tryon-stage`, `.cai-tryon-mood-banner`
- `.cai-shop-layout`, `.cai-shop-stage`, `.cai-shop-products`, `.cai-shop-cartbar`
- `.cai-carousel` (cards / thumbs variants)

CSS variables on `.cai-shell` define the palette: `--cai-ink`, `--cai-coal`, `--cai-gold`, `--cai-gold-glow`, `--cai-nude`, `--cai-cream`, `--cai-line`, `--cai-line-strong`.

---

## 12. Adding New Stuff

### A new avatar body

1. Drop the `.glb` under `public/models/<name>.glb`
2. (optional) Drop a `.png` thumbnail under `public/models/previews/<name>.png`
3. Add an entry to `lib/avatar-bodies.ts → CAELINUS_BODY_LIBRARY`
4. Mirror the entry into `public/avatars/manifest.json`
5. (optional) Add to `ARCHETYPES[*].preferredBodies` in `lib/caelinus-ai/providers/mock.ts` if a specific archetype should pick it

Mesh requirements: Mixamo standard bone names (Hips, Spine, Spine1, Spine2, Neck, Head, LeftArm…). Single skeleton, multi-mesh OK.

### A new product

1. Add to `data/products.ts → products[]`
2. If you have a GLB outfit binding, drop it under `public/models/Meshy_Al/<name>.glb` and add to `OUTFIT_GLB_MAP` in `data/products.ts`
3. Mirror it into `public/outfits/manifest.json`
4. The shop and try-on pages auto-pick it up via category filtering

### A new archetype

1. Add to `ARCHETYPES` in `lib/caelinus-ai/providers/mock.ts`
2. Provide `preferredBodies` (existing body ids), `moods[]`, `reading()`, `frequency`, `bias` (style profile delta), `energy`
3. The 6-card grid will switch to 7 cards (UI auto-handles count); if you want exactly 6, replace an existing one instead

### A new provider (real AI)

1. Create `lib/caelinus-ai/providers/<id>.ts` that exports an object satisfying `AvatarProvider`
2. Register it in `lib/caelinus-ai/index.ts` (`registerProvider(myProvider)`)
3. Either set `NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER=<id>` or call `setActiveProvider("<id>")` at boot
4. UI does NOT change

---

## 13. Things to NOT Break

- `lib/caelinus-ai/index.ts` is the **only** import surface UI uses. Don't import deep paths from pages.
- The `AvatarProvider` contract is sacred — adding optional fields is fine, removing existing ones is not.
- The 6-archetype list **order** is observable (the recommendation score breaks ties via `hashId(archetype.id) % 7 - 3`, deterministic). Reordering changes which archetype gets recommended for the same input.
- The order of `RAW_VARIANTS` in `try-on-variants.ts` is observable too — appending is safe, reordering shifts every product's "siluet".
- `caelinus-ai.css` is one big file, but it is **page-bundle-scoped** (imported only from `app/caelinus-ai/layout.tsx`). Don't import it from the global `app/globals.css`.

---

## 14. Quick Smoke Test

```bash
cd caelinus
npm run dev
```

Then open in order:

1. http://localhost:3000/caelinus-ai/avatar — upload a selfie, click "Avatarımı Oluştur"
2. http://localhost:3000/caelinus-ai/try-on — should show the avatar; click any product
3. http://localhost:3000/caelinus-ai/shop — should show the same avatar + carousel + grid + cart bar
4. Switch the avatar via the carousel — sahne (3D scene) should swap with the shimmer veil
5. Click any "Satın Al" — pulse + cart bar appears
6. Click "Ödemeye Geç" — redirects to `/universe/shop?source=caelinus-ai`

If the empty state says "Önce avatarını yarat" on `/caelinus-ai/try-on`, that's correct — the user must finalize an avatar first. The shop page works without an avatar because it falls back to the body library default.
