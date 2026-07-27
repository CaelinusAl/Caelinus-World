<!-- CAELINUS CODEX — Image Intelligence v2 quality-gate audit -->

# Vision Pilot v1 → v2 Comparison

## Gate result

- Scope: exactly `IMG-CAEL-0001`, `IMG-CAEL-0038`, `IMG-CAEL-0132`.
- Production integration: `blocked_pending_approval`.
- Legacy `data/images.json`: unchanged; 132 total, 0 analyzed.
- Canonical claims created by migration: 0.
- Automatically verified claims: 0.
- Raw AI records preserved losslessly: 3/3.

## Contract comparison

### Before — `vision-pilot.json` (`1.0.0-pilot`)

Each record mixed identity, AI observations, candidate canon links, production
suggestions and confidence in one flat result. Its `observed`, `canon_match` and
`unverified` labels described model interpretation, but did not constitute an
editorial workflow.

### After — `vision-pilot.v2.json` (`2.0.0`)

Each record is a first-class knowledge asset with separate layers:

1. `identity` — immutable asset identity and file provenance.
2. `rawAi` — lossless v1 output, model provenance and usage.
3. `candidateMetadata` — AI-derived visual facets and typed relation candidates.
4. `canonicalMetadata` — human-owned layer; empty until review.
5. `semanticLayer` — multilingual terms, entity links and cross-references.
6. `quality` — confidence, missing fields/relations, duplicate candidates.
7. `indexing` — semantic text, vector placeholder and graph node metadata.
8. `migration` — source hash and rollback contract.

All AI-derived facets and relationships have `verificationState: analyzed`.
Only a human review operation may move them to `reviewed`, `verified` or
`rejected`.

## Asset comparison

### IMG-CAEL-0001

- v1: visual description, 10 tags, Bible/entity/NPC/gameplay/economy/Unreal
  suggestions, overall confidence 0.85.
- v2: 39 typed relation candidates; searchable Turkish semantic projection;
  immutable raw source hash
  `30df14dc07066586546507987deb2a740600a87343d575a68ea6d3af16200c17`.
- Missing visual fields: lighting, mood.
- Missing relations: page, profession, quest, concept art, related image.

### IMG-CAEL-0038

- v1: prop-board description and OCR, 10 tags, production/economy/Unreal
  suggestions, overall confidence 0.80.
- v2: 44 typed relation candidates; page, volume, profession and Unreal asset
  edges; immutable raw source hash
  `5833c99c138c611134b1cbc6edc48895aed82c3475c10c665c321e997488317d`.
- Missing visual fields: composition, lighting, mood.
- Missing relations: quest, concept art, related image.

### IMG-CAEL-0132

- v1: fire-simulation description and OCR, 10 tags, detailed
  NPC/gameplay/economy/Unreal suggestions, overall confidence 0.92.
- v2: 51 typed relation candidates; page, volume, profession, gameplay and
  Unreal edges; immutable raw source hash
  `ecb203214ef3a291bc1a537f456ebdedae4f9481b0f21882755e7759a9c0e649`.
- Missing visual fields: mood.
- Missing relations: chapter, quest, concept art, related image.

## Compatibility

The v2 migrator reads `vision-pilot.json` and `codex.json`; it does not import,
modify or overwrite the production `images.json` contract. At migration time
the full file SHA-256 and a stable contract-content SHA-256 were recorded.
Validation compares the current contract content while excluding only the
volatile `generatedAt` value. A normal rebuild may change the file hash, but any
slot, count or metadata contract change still fails validation.

Consumers continue reading `images.json`. No v2 reader, route, page, index or
graph integration has been activated.

## Rollback

Rollback is currently a no-op for production because v2 has not been wired to
any consumer:

1. Disable or remove the future v2 feature flag/consumer.
2. Restore the existing `images.json` read path.
3. Retain `vision-pilot.json` and frozen sources.
4. Ignore or remove the generated `vision-pilot.v2.json`.
5. Run `node codex/engine/build.mjs` and verify 132 total / 0 analyzed.

No reverse data migration is needed. The legacy contract remains authoritative
until explicit schema approval.
