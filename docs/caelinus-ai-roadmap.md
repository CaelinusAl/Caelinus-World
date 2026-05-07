# CAELINUS AI — Production Roadmap

> The plan to take Caelinus AI from MVP-with-mock-provider to a production-grade,
> Caelinus-owned avatar generation pipeline.
>
> Read `caelinus-ai-memory.md` first if you don't yet know the codebase.

---

## 0. North Star

A user uploads a selfie, and within 30 seconds, a 3D avatar with **their face** appears on a Caelinus-owned mesh, in a Caelinus archetype, ready to wear Caelinus garments rendered with real cloth physics — all inside the existing `/caelinus-ai/*` UI without changing a line of frontend code (because the `AvatarProvider` contract holds).

No vendor lock-in. No Avaturn / RPM hat. No research-only licenses.

---

## 1. Architectural Decisions (locked-in)

| Decision | Choice | Why |
|---|---|---|
| **Vendor strategy** | Own pipeline, no Avaturn / RPM | Founder vision: Caelinus owns avatar architecture |
| **Face geometry** | MediaPipe FaceMesh (Apache 2.0) → Caelinus head morph | Commercial-clean, no FLAME/DECA license fees |
| **Body model** | MakeHuman base (CC0) → Caelinus retopology + 12 blendshapes | Commercial-clean, parametric |
| **Face texture** | Stable Diffusion XL + ControlNet inpaint | Commercial-clean (creativeml-openrail-m) |
| **Hair** | Card-based system, 12 Caelinus-designed presets | Owned IP, ships with brand voice |
| **Cloth** | Marvelous Designer offline bake → GLB poses, body-shape-matched at runtime | Hybrid: real sim where it matters, illusion where it doesn't |
| **Compose** | Blender Python (`bpy`) headless on GPU container | GPL on tooling does not infect output assets |
| **Auto-rig** | Mixamo (Adobe) | Existing license, ships with brand-acceptable terms |
| **GPU** | RunPod Serverless (A100/L40S) | Pay-per-second, scale to zero, no fixed cost |
| **Storage** | Cloudflare R2 (S3-compatible) | 10GB free, $0.015/GB after — cheapest |
| **Queue** | BullMQ on Upstash Redis OR Inngest | Either works; pick after cost compare |
| **DB / Auth** | Supabase (already integrated) | Existing investment, Postgres + RLS |
| **Backend framework** | Next.js Route Handlers + Edge runtime where possible | Single repo, single deploy |
| **Provider integration** | New `caelinusStudioProvider`, plugged via env var | UI never changes |

Items strictly NOT on the roadmap (avoid): FLAME, DECA, EMOCA, SMPL-X, Neural Haircut — all carry research-only licenses by default. We can revisit if Stability AI / Adobe partnership opens commercial-priced paths.

---

## 2. Twelve-Sprint Plan

Sprint length: 1-4 weeks. Each ends in a **demo + go/no-go gate**. No skipping.

### S1 — Backend Skeleton (2 weeks)

**Goal:** A stub `caelinusStudioProvider` already runs the full UI flow end-to-end through real HTTP + SSE, but the GPU work is mocked server-side. Zero UI changes.

Deliverables:
- Supabase tables: `caelinus_jobs`, `caelinus_avatars`, `caelinus_selfies`, `caelinus_job_events`
- API routes:
  - `POST /api/caelinus/jobs` — create
  - `GET /api/caelinus/jobs/:id` — status snapshot
  - `DELETE /api/caelinus/jobs/:id` — cancel
  - `GET /api/caelinus/jobs/:id/stream` — SSE phases
  - `POST /api/caelinus/jobs/:id/finalize` — finalize match
- Job storage abstraction (`InMemoryStore` for dev, `SupabaseStore` for prod, env-driven)
- `caelinusStudioProvider` (talks to API)
- Provider registry update — env var `NEXT_PUBLIC_CAELINUS_AVATAR_PROVIDER` picks `mock` or `studio`
- Smoke test: switch env to studio, full avatar flow works through HTTP

**Demo:** A user goes through `/caelinus-ai/avatar` with `studio` provider active. Match grid appears via SSE progress events. UI looks identical to mock flow. Backend logs show real HTTP traffic.

### S2 — MediaPipe Worker on RunPod (3 weeks)

**Goal:** Selfie blob → 478 landmarks → Caelinus head morph parameters, returned as JSON.

Deliverables:
- Python container with MediaPipe Tasks Vision
- RunPod serverless endpoint (`/runpod/face-analyze`)
- Heuristic skin/hair/eye color sampler (port the browser logic to Python)
- Face shape classifier (oval / round / heart / square / long)
- Backend: replace job stub face-analysis phase with real RunPod call
- Caching: identical selfie hash → reuse analysis (Redis 24h TTL)

**Demo:** Upload selfie, see live progress: "Yüzünden bir frekans okuyoruz…" — actual GPU latency, real face-shape returned, displayed in match cards.

### S3 — Caelinus Head Topology Bake (2 weeks)

**Goal:** Caelinus-designed head mesh that MediaPipe landmarks can drive via blendshape morph.

Manual (founder): Wrap4D session — produce `caelinus-head-base.glb` (5-8k poly, 32 FACS blendshapes, UV-ready).

Code:
- Asset pipeline: `caelinus-head-base.glb` lives in `/public/models/base/`
- Runtime morph driver — MediaPipe landmark deltas mapped to blendshape weights (Three.js)
- Composer step: take face-analyze JSON → drive blendshapes → bake morph state into output mesh

**Demo:** Selfie face appears on Caelinus head topology. Side-by-side: input selfie + output 3D head rotating in Caelinus aura.

### S4 — Caelinus Body Parametric (3 weeks)

**Goal:** 12 blendshapes on the Caelinus body, slider-driven, runtime-interpolated.

Manual (founder): Wrap4D body retopology + blendshape sculpting. Outputs `caelinus-body-base.glb`.

Code:
- Body component reads blendshapes, exposes slider props (height / weight / shoulder / bust / waist / hip / thigh / arm)
- Storage: `AvatarStyleProfile.bodyParams` (numeric vector, persisted)
- UI: extend `StyleCustomizer` with body sliders behind a "Bedenini Ölç" expander
- Composer: bake body shape into output GLB

**Demo:** User slides "boy 165cm → 180cm" — avatar grows in real time. Save and reload — shape persists.

### S5 — PIXIE Body-from-Selfie (Optional, 2 weeks)

**Goal:** If user uploads a full-body selfie, infer body parameters automatically.

Note: PIXIE is research-licensed. Two paths:
1. **Skip this sprint** if PIXIE commercial license is too expensive — users use sliders only
2. **Build alternative** — train a small MLP on MakeHuman synthetic data → silhouette → 12 params

Decision deferred until S4 is shipped.

### S6 — Hair Card System (4 weeks)

**Goal:** 12 hair presets matched to Caelinus archetypes, selfie-aware preset selection.

Manual (founder): Design 12 hair preset GLBs in Blender (~3 weeks of work).

Code:
- Hair component: bone-bound hair card mesh, alpha-blended texture
- Hair classifier: selfie hair pixels → preset-id score (length × texture × color)
- Composer: snap selected preset onto Caelinus head bone chain
- Override UI: `StyleCustomizer.hair` swaps preset by id

**Demo:** Same selfie, two different hair presets — user can swap mid-flow without re-running pipeline.

### S7 — QR Mobile Selfie Flow (4 weeks)

**Goal:** Desktop user scans QR code, takes selfie on phone, mesh appears on desktop within 2 seconds.

Code:
- New route `/caelinus-ai/avatar/m` (already a stub) — full mobile capture UI
- Pairing: desktop creates session → QR code → phone joins via session id (Supabase Realtime channel)
- Live preview: phone-side capture, desktop-side preview while user composes
- Selfie upload directly from phone → R2 → triggers job
- WebRTC where possible, Supabase Realtime as fallback

**Demo:** Open `/caelinus-ai/avatar` on desktop, scan QR with phone camera, take selfie. Avatar appears on desktop while you're still holding the phone.

### S8 — Marvelous Cloth Pose Bake (4 weeks)

**Goal:** Replace today's "outfit illusion" with body-shape-matched cloth meshes.

Manual (founder): For each Caelinus product, simulate in Marvelous Designer against 3 body shapes (small/medium/large), export Alembic, convert to GLB. Started: 0 / 24 products. Estimate ~30-60 min per product × 3 shapes = ~36-72 hours of focused work.

Code:
- Cloth pose loader: at try-on time, find baked GLB nearest the user's body params (12-vector kNN)
- Render: replace `selin*.glb` variant trick with the matched cloth pose
- Backwards compatibility: keep variants as fallback when no baked pose exists

**Demo:** Try on Aries bikini on a tall lean body vs a curvy body — completely different drape. Today the silhouette is hashed; this swaps it for real Marvelous physics.

### S9 — SDXL Face Texture (3 weeks)

**Goal:** Photorealistic face texture from selfie, projected on Caelinus head topology.

Code:
- RunPod container with Stable Diffusion XL + ControlNet (depth/canny conditioning)
- Pipeline phase: selfie → SDXL inpaint → UV-unwrapped diffuse map (1024×1024)
- Composer: assign texture to Caelinus head material
- Quality gate: skin tone preserved, identity preserved (face-swap regression test)
- LoRA training (later): Caelinus aesthetic LoRA on diffuse maps for "Solar Couture" → gold-leaf skin glow, "Ritual Flame" → deeper saturation, etc.

**Demo:** Two selfies, different faces — final 3D avatars look like the people from the selfies, in Caelinus aesthetic.

### S10 — Real-time Cloth (Optional, 4 weeks)

**Goal:** Move from baked poses to runtime cloth simulation in the browser.

Tech: WebGPU compute shaders (PBD / XPBD position-based dynamics) or NVIDIA Flex via WASM.

Decision: Defer until S8 customer feedback confirms users notice the static-pose limitation.

### S11 — Atelier Kiosk (3 weeks)

**Goal:** A dedicated kiosk experience for the Caelinus Bosphorus studio.

Code:
- New route `/caelinus-ai/kiosk` — fullscreen, no header, ambient mode
- Idle state: cinematic auto-playing archetype reel
- Active state: capture flow with kiosk-style UI (large buttons, no nav)
- Hardware: RTX 4090 PC + softbox lighting + touchscreen
- Output: QR code with avatar id → user takes home on their phone

**Demo:** Stand at the kiosk for 60 seconds, walk away with an avatar in your pocket.

### S12 — Production Hardening (3 weeks)

- Cost dashboard (Supabase + Cloudflare + RunPod usage)
- Rate limiting (avoid abuse)
- KVKK / GDPR data retention (selfie auto-purge after 30 days unless user saves)
- Admin moderation tools
- Monitoring: Sentry / Axiom for errors, Better Stack for uptime
- Closed beta: 20-30 users, NDA, feedback survey
- Soft launch on `caelinus.ai`

---

## 3. Founder's Manual Tasks

These cannot be coded by the agent. The founder owns them.

### A. Accounts & Services (1 day)
- [ ] **A1** RunPod account, $20 credit
- [ ] **A2** Cloudflare R2 bucket (named `caelinus-avatars`)
- [ ] **A3** Supabase Pro upgrade (already on Free? confirm)
- [ ] **A4** Marvelous Designer Personal license ($50/mo)
- [ ] **A5** Wrap4D 1-seat lifetime (€299)
- [ ] **A6** Adobe Mixamo confirmation (already in Creative Cloud?)

### B. Licensing & Legal (1 week)
- [ ] **B1** Read & confirm MakeHuman 1.x mesh CC0 license
- [ ] **B2** Read & confirm Stable Diffusion XL `creativeml-openrail-m` (commercial OK)
- [ ] **B3** Read & confirm Mixamo TOS allows commercial avatar export
- [ ] **B4** Vendor MediaPipe Apache 2.0 license file into repo
- [ ] **B5** Lawyer consult: KVKK / GDPR-compliant selfie handling text
- [ ] **B6** Lawyer consult: Caelinus AI Terms of Service draft
- [ ] **B7** Privacy Policy update — new selfie storage flow

### C. 3D Asset Production (continuous, biggest workload)

#### C1. Caelinus Head Topology (1-2 weeks, BLOCKER for S3)
- [ ] Wrap4D session: produce `caelinus-head-base.glb`
- [ ] 5-8k polygon, symmetric, Mixamo bone-compatible
- [ ] 32 FACS blendshapes
- [ ] UV layout for diffuse / normal / roughness / specular
- [ ] Drop in `/public/models/base/`
- [ ] `head-topology.json`: 468 MediaPipe landmark → mesh vertex mapping (founder + agent collaborate)

#### C2. Caelinus Body Base (2-3 weeks, BLOCKER for S4)
- [ ] Wrap4D retopo: MakeHuman → Caelinus topology
- [ ] 12 blendshapes (height, weight, shoulder, bust, waist, hip × narrow/wide pairs)
- [ ] Mixamo skeleton + skin weights
- [ ] Drop in `/public/models/base/caelinus-body-base.glb`

#### C3. Hair Preset Library (3-4 weeks, BLOCKER for S6)
- [ ] 12 hair preset GLBs in Blender
- [ ] Each: 30-50 hair cards + alpha texture + Mixamo head bone bind
- [ ] Naming: `goddess-veil-long`, `lunar-wave-mid`, `solar-couture-long`, `earth-curl-full`, `futurist-crop`, `ritual-flame-veil`, plus 6 bonus presets
- [ ] Drop in `/public/hair/<preset-id>.glb`

#### C4. Cloth Pose Bake (continuous, BLOCKER for S8)
- [ ] Marvelous Designer per-product simulation
- [ ] 24 products × 3 body shapes = 72 GLBs
- [ ] Output to `/public/outfits/baked/<product-id>-<shape>.glb`

#### C5. Texture Library (1 week)
- [ ] 12 hair textures (diffuse + normal + roughness)
- [ ] 12 skin textures (Caelinus palette tinted)
- [ ] 6 eye textures
- [ ] Drop in `/public/textures/{hair,skin,eye}/`

### D. Brand & Content Decisions (founder + agent)
- [ ] **D1** Approve / amend the 6 archetypes (current: Goddess Minimal, Lunar Auteur, Solar Couture, Earth Veil, Futurist Oracle, Ritual Flame)
- [ ] **D2** Write 72 reading texts (6 archetypes × 3 moods × 4 elements)
- [ ] **D3** Pick languages (TR + EN minimum)
- [ ] **D4** Pricing model (free generation / credit-pack / subscription?)
- [ ] **D5** Beta tester list (20-30 names)

### E. Test & QA (continuous)
- [ ] Founder selfie set: 5-10 photos in different lighting
- [ ] Friend selfie set: 5-10 different face types (with consent)
- [ ] Post-sprint demo review (30 min each)

### F. Atelier Kiosk Hardware (S11 prerequisite)
- [ ] RTX 4090 PC at the Bosphorus studio
- [ ] Softbox + ring light setup
- [ ] Touchscreen / tablet
- [ ] QR code printer

---

## 4. Provider Contract Stays Sacred

The most important rule of this roadmap:

```ts
// THIS interface does NOT change across all 12 sprints.
export interface AvatarProvider {
  readonly id: string;
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

When S2 ships RunPod-backed face analysis, only `caelinusStudioProvider.analyzeSelfie` changes. When S6 ships hair, only the runner emits new asset URLs in the result. UI is untouchable.

---

## 5. Cost Estimate (12 months)

| Line item | Per month | Per year |
|---|---|---|
| RunPod GPU (dev) | $80 | $960 |
| RunPod GPU (prod, low) | $200 | $2,400 |
| RunPod GPU (prod, high) | $800 | $9,600 |
| Cloudflare R2 storage | $10 | $120 |
| Supabase Pro | $25 | $300 |
| Marvelous Designer | $50 | $600 |
| Wrap4D | — | €299 (one-time) |
| Stable Diffusion provider (if outsourced) | $40 | $480 |
| **Low total** | **~$405** | **~€5,000** |
| **High total** | **~$1,000** | **~€12,000** |

Plus founder time: ~3-5 weeks of focused 3D asset work spread across the 12 months.

---

## 6. Decision Gates

No sprint starts without the previous one passing its demo. The agent will pause and request approval at each gate.

```
S1 ✓ Backend skeleton  → demo live → APPROVE?
S2 ✓ Face analysis     → demo live → APPROVE?
S3 ✓ Head bake         → demo live → APPROVE?
S4 ✓ Body parametric   → demo live → APPROVE?
S5 ✓ PIXIE / fallback  → demo live → APPROVE?
S6 ✓ Hair presets      → demo live → APPROVE?
S7 ✓ QR mobile         → demo live → APPROVE?
S8 ✓ Cloth bake        → demo live → APPROVE?
S9 ✓ SDXL texture      → demo live → APPROVE?
S10 ✓ Realtime cloth   → demo live → APPROVE?
S11 ✓ Atelier kiosk    → demo live → APPROVE?
S12 ✓ Production       → soft launch → CLOSED BETA → PUBLIC
```

---

## 7. What's Already Done (S0)

The MVP shipped in the prior session is the launchpad:

- ✅ `AvatarProvider` interface + registry
- ✅ `mockProvider` with MediaPipe + 6 archetypes (browser-side)
- ✅ `/caelinus-ai/avatar` — selfie + style + match grid + finalize
- ✅ `/caelinus-ai/try-on` — outfit illusion, aura, mood banner
- ✅ `/caelinus-ai/shop` — sticky avatar + AvatarCarousel + product grid + cart bar
- ✅ `Caelinus3DScene` — try-on aura, swap veil, glow rim
- ✅ `CAELINUS_BODY_LIBRARY` — 14 selectable bodies (8 Selin variants + 6 Caelinus)
- ✅ Storage: localStorage + IndexedDB
- ✅ `public/avatars/manifest.json` + `public/outfits/manifest.json`
- ✅ Architectural memory doc

S1 starts NOW.
