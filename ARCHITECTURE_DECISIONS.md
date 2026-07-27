# Caelinus Architecture Decisions

This log is updated whenever a new feature introduces an architectural
boundary or persistent data contract.

## ADR-001 — Keep visual similarity separate from canonical knowledge

- Date: 2026-07-27
- Status: Accepted for offline index; production integration pending approval
- Feature: Phase 3.5 Image Similarity Graph

### Context

The Codex needs visual-neighbor and duplicate candidates for 132 concept
images. Perceptual similarity is probabilistic: two boards can share palette
and composition without sharing canon, production page, NPC, quest or gameplay
meaning. Writing these guesses into canonical metadata would violate the Canon
Manifest's human-approval boundary.

### Decision

Visual similarity is stored in an independent, versioned graph:

- Schema: `codex/schema/image-similarity-graph.v1.schema.json`
- Data: `codex/data/image-similarity-graph.v1.json`
- Builder: `codex/engine/build-image-similarity.mjs`
- Validator: `codex/engine/validate-image-similarity.mjs`

The graph contains image nodes and non-canonical similarity edges only. Every
edge declares `canonical: false`, `verificationState: analyzed`, its algorithm,
score, confidence and creation timestamp. No canonical consumer reads this
file.

### Algorithms

1. `pHash` (`dct32-low8-v1`)
   - 32×32 grayscale image.
   - 8×8 low-frequency DCT descriptor.
   - Hamming similarity.
   - Store top 8 neighbors per node plus score ≥ 0.82.
2. `color_layout` (`rgb-grid4x4-v1`)
   - 4×4 normalized sRGB layout descriptor.
   - Normalized Euclidean similarity.
   - Store top 8 neighbors per node plus score ≥ 0.975.

Top-K guarantees every image has neighbors. Threshold edges retain unusually
strong links. The color threshold is intentionally high because the archive's
shared dark/gold visual language otherwise produces a dense, low-information
graph.

### Consequences

- Similarity and duplicate candidates can be reviewed without contaminating
  canon.
- The index remains reproducible from immutable source images.
- Graph size is bounded while preserving complete node coverage.
- Similarity does not imply same Bible, page, NPC, quest, gameplay system or
  production chain.
- Exact or near-duplicate candidates still require human action.

### Integration gate

Production integration remains `blocked_pending_approval`. A future feature
may read this graph only after explicit approval and must keep canonical links
in a separately reviewed layer.

### Rollback

No production rollback or reverse migration is required because no consumer is
connected. Disable or remove `image-similarity-graph.v1.json`; legacy
`images.json`, Image Intelligence v2, canon and source assets remain unchanged.

## ADR-002 — Make `/archive` the primary Codex Experience Layer

- Date: 2026-07-27
- Status: Accepted
- Feature: Codex Experience Engine v1

### Context

The Codex already has a frozen Canon Layer, generated Data Layer and stable
vanilla reference reader. The primary product now needs a cinematic,
accessible experience without moving parsing, relationship or editorial logic
into React components. The same knowledge-navigation model must remain
portable to a future Unreal client.

### Decision

The architecture follows one direction:

`Canon Layer → generated Data Layer → versioned Experience Contract → client adapters`

- Next.js `/archive` is the primary user experience.
- `codex/web` stays unchanged as a stable reference implementation.
- `lib/codex/experience-contract.ts` is a JSON-serializable,
  framework-neutral presentation contract.
- `lib/codex/archive-data.ts` is a read-only server adapter over existing
  generated Codex files.
- React components own rendering, focus, camera intent, audio consent and
  finite transitions only.
- Section prose and local images are loaded lazily through guarded Route
  Handlers; the full 3.3 MB source tree is not sent to the client.
- The Knowledge Graph uses canonical `codex.graph` only. Approval-gated Vision
  v2 and visual similarity graphs are not consumed.

### Motion and audio

- Navigation and data operations never wait for animation.
- Reduced Motion removes depth transitions and atmospheric motes.
- Atmospheric motes are finite intro decoration, not a perpetual frame loop.
- Web Audio starts only after explicit user interaction, exposes mute state,
  pauses while the document is hidden and is disposed on unmount.

### Unreal portability

Experience state uses serializable IDs and intents (`OPEN_VIEW`,
`OPEN_SECTION`, `SELECT_ENTITY`, camera reset) rather than DOM references.
Future Unreal integration should implement a new renderer and transport around
the same versioned contract; it must not duplicate canon parsing.

### Deployment constraint

Codex text JSON is committed and available to the Next server. Concept images
remain outside Git and require `CODEX_ASSET_DIR` locally or a future approved
object-storage/CDN adapter in production. Missing assets degrade to an explicit
vault state rather than breaking the experience.

### Rollback

Restore the previous `app/archive/page.tsx` or route `/archive` back to the
stable `codex/web` deployment. Canon, generated data and `codex/web` require no
reverse migration because the Experience Layer is read-only.

## ADR-003 — Two public domains, one Caelinus system

- Date: 2026-07-27
- Status: Accepted; DNS and provider configuration pending
- Feature: Public domain routing

### Context

Caelinus needs two distinct public entrances without splitting its platform:

- `caelinus.ai` presents the universe, game, community and investor journey.
- `templeofsilence.com` is the canonical home of the Living Codex.

Duplicating deployments, APIs, assets or canon would create drift and violate
the single-source-of-truth boundary.

### Decision

Both apex domains attach to the same Next.js/Vercel project and therefore use
the same backend, Supabase project, API Route Handlers, Codex data and asset
pipeline. `proxy.ts` selects presentation by request host:

- `templeofsilence.com/` rewrites internally to `/archive`; the public URL stays
  `/`.
- `templeofsilence.com/archive` redirects permanently to its canonical root.
- `caelinus.ai/archive` redirects permanently to `templeofsilence.com`.
- API and static paths retain one shared implementation on either host.
- Metadata, `robots.txt` and `sitemap.xml` emit the canonical Codex origin when
  requested through the Temple host.

Public origins live in `lib/public-domains.ts`. Presentation components import
that contract instead of duplicating domain strings. Cross-domain links
navigate immediately; the destination's cinematic entrance supplies the
transition, so navigation never waits for animation.

For local host-routing verification, `templeofsilence.localhost` and
`caelinus.localhost` map to the same development server without editing the
operating-system hosts file or changing production origins.

### Authentication boundary

Both entrances use the same Supabase tenant and user identities. Browser
cookies cannot be shared directly between two different registrable domains
(`caelinus.ai` and `templeofsilence.com`). “Same authentication” therefore
means one identity provider and authorization model, not one cross-domain
cookie.

If authenticated Codex features are introduced, use the central auth origin
plus a short-lived, single-use OAuth/PKCE handoff to establish a first-party
session on the destination domain. Never pass access or refresh tokens in query
parameters. Both origins and callback URLs must be allow-listed in Supabase.

### Operational requirements

1. Attach both apex domains (and desired `www` aliases) to the same Vercel
   project.
2. Set `NEXT_PUBLIC_CAELINUS_ORIGIN` and `NEXT_PUBLIC_CODEX_ORIGIN`.
3. Keep `NEXT_PUBLIC_SITE_URL=https://caelinus.ai` as the central email/auth
   callback origin until the approved session-handoff flow exists.
4. Add both HTTPS origins to Supabase Auth URL Configuration and any external
   OAuth provider allow-lists.
5. Keep asset and API CORS same-origin by default; add both origins only if a
   future API is intentionally called cross-origin.

### Consequences

- Each domain has a clear product identity and canonical URL.
- Codex code, canon and assets remain single-instance.
- `/archive` continues to work internally and in preview deployments.
- Search engines see one canonical Codex origin.
- Cross-domain authenticated continuity requires an explicit secure handoff;
  it must not be simulated with shared cookies.

### Rollback

Detach `templeofsilence.com`, remove the public-entrance branch in `proxy.ts`
and restore `/archive` as the public Codex URL. No data, auth or asset migration
is required.

## ADR-004 — Experience Milestone 001 is a presentation-only ritual

- Date: 2026-07-27
- Status: Accepted
- Feature: Temple entrance and Genesis reveal

### Context

The first Temple visit must move visitors from a black threshold through
silence, one breath, distant nature, gold dust and shifting stone into the
Living Book. This is an experience
milestone, not a request for new lore, metadata or a second scene engine.

### Decision

- The entrance is a finite state sequence inside the existing
  `CinematicIntro`.
- Stone architecture, gate depth and the opening book use bounded CSS
  transforms; no perpetual JavaScript render loop or new 3D dependency is
  introduced.
- The first interaction starts loading the existing canonical Genesis section
  immediately. Data loading does not wait for the cinematic sequence.
- The entrance sound uses the shared `Ambience` lifecycle but has a fixed audio
  clock: two seconds of silence, one breath, one distant bird and wind that
  resolves to zero before the interior.
- Audio begins only after explicit interaction because browsers prohibit
  reliable autoplay with sound.
- Door leaves do not swing. The seal illuminates, individual stone cells shift,
  and the camera passes through as the threshold recedes.
- “Temple of Silence / The Living Codex of Caelinus” appears faintly only at
  the crossing. A local presentation flag prevents repeating the title in the
  same browser; it carries no identity or authorization meaning.
- Reduced Motion replaces gate/camera movement with a short crossfade and
  preserves immediate access. Escape and a visible skip control bypass the
  sequence.

### Canon boundary

The visual book label comes from the existing Genesis Bible identity and the
opened page is loaded through the existing section API. No Canon, Codex data,
Vision metadata or similarity relationship is created or changed.

### Rollback

Restore the previous `CinematicIntro`, remove `createTempleEntranceSound` and return the
initial archive view to `home`. The Experience contract, canonical data and
domain routing remain unchanged.

## ADR-005 — Public Codex is a Living Book, not an asset vault

- Date: 2026-07-27
- Status: Accepted for vertical-slice review
- Feature: Living Book Rebuild 001

### Context

The thumbnail Image Vault exposes implementation language—filenames, asset IDs,
analysis status and byte size—and reads as an internal file manager. The public
Codex must instead present one sacred volume and one page at a time. Archivists
still need the technical surface, but those two information architectures
cannot share a default route or payload.

### Decision

- `/archive` is the full-screen `CAELINUS CODEX / THE LIVING BOOK OF ANATOLIA`
  cover using the externally managed `kapak.png`.
- `/archive/contents` is the book hierarchy.
- `/archive/chapter/[slug]` is a chapter threshold.
- `/archive/read/[page]` is a one-image full-screen reader with keyboard,
  tap-zone and mobile swipe navigation.
- `/archive/internal` retains the technical Image Vault and is marked
  `noindex`. It is not linked from the public experience.
- The initial approval slice exposes only five public pages.

### Public data boundary

`LivingBookPublicModel` is separate from `ArchiveBootstrap`. Public records
contain presentation title, chapter, page number and image URL only. Source
filename, bytes and analysis status remain in the server/internal model.

Canonical titles are used only when the source record is reviewed or verified.
Otherwise the deterministic fallback is:

`CAELINUS CODEX — PAGE XXX`

The fallback is presentation language, not new canon. Vision v2 and similarity
data remain disconnected.

### Asset policy

Source files are not renamed or copied. The cover and page images continue
through guarded read-only Route Handlers backed by the shared Codex asset
directory. Production still requires the approved remote asset-pipeline
adapter; local OneDrive paths are not deployable storage.

### Accessibility and motion

The reader preserves original image aspect ratio and shows exactly one image.
Keyboard arrows, Escape, visible controls, mobile swipe and tap zones provide
equivalent navigation. Motion is finite and Reduced Motion removes book/page
depth transforms without delaying routing.

### Rollback

Restore the previous `/archive` page and remove the four Living Book routes.
`/archive/internal`, canonical data and source assets require no migration or
reverse write.

## ADR-006 — Final image ingest maps 132 assets to 132 book pages

- Date: 2026-07-27
- Status: Accepted
- Feature: Final Living Book image ingest

### Context

The approved vertical slice established the reader language. The remaining
images must now join that book without reintroducing gallery behavior,
technical labels or unreviewed canon. Reader continuity must survive route
changes and return visits, while later narration and relation features should
not require a new page contract.

### Decision

- Manifest order is the deterministic public page order: one source image,
  one page, 001–132.
- Unreviewed pages use `CAELINUS CODEX — PAGE XXX`.
- Until editorial chapter mapping exists, all image pages belong to the
  explicitly neutral `Image Archive` chapter and volume.
- The renamed `kapak.png` replaces the first unavailable legacy manifest path
  in the presentation adapter. Canonical files and `images.json` are not
  rewritten.
- Public image URLs use page numbers, not asset IDs. Technical references and
  filenames remain server/internal only.
- `PublicCodexPage` reserves optional narration, annotation, Unreal, NPC,
  gameplay and relation-graph fields. Empty future fields produce no UI.

### Reading continuity

A versioned local presentation record stores only last page, last chapter and
normalized progress. Opening the cover resumes that page when a valid record
exists; otherwise it opens contents. This state is not canonical data,
identity, analytics or authorization.

### Audio and transitions

The archive layout owns one opt-in room-tone instance, so client-side page
navigation does not restart audio. The initial Open Book gesture starts it;
direct deep links expose a small consent control. Page changes keep one visual
page mounted, use finite depth/crossfade and reset bounded gold dust. Reduced
Motion removes depth effects.

### End page

Page 132 advances to a dedicated terminal leaf:

`Devam ediyor...`

`Every new page written expands the living memory of Anatolia.`

It is presentation copy and creates no canon relationship.

### Rollback

Set the public loader back to five records and remove the end route branch.
Local reading state can be ignored safely; no source, Canon or internal archive
migration is required.

## ADR-007 — Production Codex media uses public Vercel Blob storage

- Date: 2026-07-27
- Status: Accepted
- Feature: Production asset delivery

### Context

The 132-page reader and cover previously depended on a local OneDrive folder.
That path is intentionally outside Git and does not exist in Vercel Functions,
so a successful application build could still deploy broken media routes.
The renamed `kapak.png` also left the legacy `IMG-CAEL-0004` filename absent.

### Decision

- Public Codex media is uploaded to the project-linked, public
  `caelinus-codex-assets` Vercel Blob store.
- `codex/data/image-assets.production.v1.json` is the versioned deployment
  manifest. It stores stable public URLs, byte counts, content types and
  SHA-256 integrity values; it contains no canonical metadata.
- Route Handlers redirect to Blob delivery instead of proxying image bytes
  through Vercel Functions. The local guarded file resolver remains a
  development fallback only.
- `IMG-CAEL-0004` and public page 4 explicitly alias the uploaded cover,
  preserving the 132-page contract without modifying `images.json`.
- `codex/engine/upload-production-assets.mjs` is the reproducible upload path.
  Its read/write token remains server-only and is provisioned by the linked
  Blob store.

### Rollback

Remove the production asset manifest to return Route Handlers to the local
read-only resolver. Blob objects can remain available during rollback; deleting
them is a separate explicit storage operation.
