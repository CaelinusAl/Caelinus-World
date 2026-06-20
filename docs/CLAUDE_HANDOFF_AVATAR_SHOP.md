# Claude Handoff: Avatar Shop Game Experience

## Context

Project was moved out of OneDrive because Next.js/Turbopack could not write `.next`
cache files under:

`C:\Users\asus\OneDrive\Desktop\caelinus-src`

The working local copy is:

`C:\Users\asus\Desktop\caelinus-src-local`

The browser page tested:

`http://localhost:3000/universe/shop/avatar`

## Local Git State

Working branch in the local copy:

`codex/avatar-shop-game-experience`

Local commit already created:

`5578db5 Improve avatar shop experience`

Important: local push failed because Git for Windows HTTPS/schannel could not find
credentials:

`schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`

GitHub plugin could read the repo but did not have write permission to create a
branch. Do not redo the implementation from scratch; use the local commit/diff.

## Files Intentionally Changed

Only these files should be included in the PR:

- `app/api/products/route.ts`
- `app/globals.css`
- `app/universe/shop/avatar/page.tsx`
- `components/shop/AvatarConfigurator.tsx`
- `data/products.ts`

Do not include these local/generated/unrelated changes:

- `next-env.d.ts`
- `package-lock.json`
- `.claude/`

## What Changed

### Avatar shop UX

`/universe/shop/avatar` was redesigned from a plain avatar configuration page
into a game-like avatar room:

- Large avatar stage on the left.
- Wardrobe inventory panel on the right.
- Category controls for Look, Pareo, Bag, Shoe, Gem.
- Product cards show price, category/zodiac, and whether the product has 3D.
- Mobile/tablet layout collapses into a stacked stage + horizontally scrollable inventory.
- Studio controls were moved into a lower drawer so the first viewport feels like an experience, not a form.

### Product sorting

Product ordering is now deterministic and shared by frontend/backend:

- Category order:
  `bikini`, `pareo`, `bag`, `heels`, `jewelry`
- Zodiac order:
  `aries`, `taurus`, `gemini`, `cancer`, `leo`, `virgo`, `libra`,
  `scorpio`, `sagittarius`, `capricorn`, `aquarius`, `pisces`

Added helpers in `data/products.ts`:

- `SHOP_CATEGORY_ORDER`
- `ZODIAC_PRODUCT_ORDER`
- `getProductSortRank`
- `sortProductsForAvatar`

`app/api/products/route.ts` now returns filtered products using this same sort.

### Outfit binding

The selected product is now passed into the 3D avatar scene when it has
`outfitGlb`.

`components/shop/AvatarConfigurator.tsx` now accepts:

- `outfitBindings`
- `onOutfitStatus`

It stores the avatar root via `onSceneReady` and renders `OutfitBindingLayer`
for each binding.

Important finding:

`public/models/caelinus-body-base-fem.glb` contains only:

- `base` body mesh
- `base_1` eye mesh

It does not contain clothing. So clothing must be attached from product GLBs.

Current 3D coverage from the sorted first 12 products:

- 3D ready: `b1`, `b3`, `b4`, `b6`, `b7`, `b8`, `b10`, `b12`
- No 3D yet: `b2`, `b5`, `b9`, `b11`

### Skin tone behavior

Code path in `ModelAvatar` indicates the default Caelinus mesh is recolored with
`config.skinTone`, so skin tone selection should affect the avatar body material.

Note: `lib/avatar-bodies.ts` has `supportsSkinToneOverride: false` for Selin,
but `AvatarConfigurator` still passes `config` to `ModelAvatar`, and
`ModelAvatar` uses `avatarConfig.skinTone` for material assignment. The face decal
is gated by `supportsSkinToneOverride`, not the base material path.

## Validation Already Run

From:

`C:\Users\asus\Desktop\caelinus-src-local`

Commands run successfully:

```powershell
npx.cmd tsc --noEmit --incremental false
```

```powershell
npx.cmd eslint app/universe/shop/avatar/page.tsx components/shop/AvatarConfigurator.tsx app/api/products/route.ts data/products.ts
```

Lint has no errors. It reports only two existing warnings about raw `<img>` usage
in `app/universe/shop/avatar/page.tsx`.

Sorting check:

```powershell
npx.cmd tsx -e "import { productsExtended, sortProductsForAvatar } from './data/products.ts'; const sorted=sortProductsForAvatar(productsExtended); console.log(sorted.slice(0,12).map(p=>p.id+':' + (p.zodiac ?? p.category) + ':' + (p.outfitGlb ? '3D' : 'no3D')).join(','));"
```

Expected output:

```text
b1:aries:3D,b2:taurus:no3D,b3:gemini:3D,b4:cancer:3D,b5:leo:no3D,b6:virgo:3D,b7:libra:3D,b8:scorpio:3D,b9:sagittarius:no3D,b10:capricorn:3D,b11:aquarius:no3D,b12:pisces:3D
```

Next dev server in the local copy returned:

`GET /universe/shop/avatar 200`

## Recommended Claude Actions

1. Open:

   `C:\Users\asus\Desktop\caelinus-src-local`

2. Confirm branch/commit:

   ```powershell
   git status -sb
   git log -1 --oneline
   ```

3. Make sure only the 5 intended files are committed/pushed.

4. Fix local GitHub auth/push using one of these safer options:

   - Run `gh auth login`, then `gh auth setup-git`, then push.
   - Or configure Git Credential Manager correctly.
   - Or use SSH remote if SSH key is configured.

5. Push:

   ```powershell
   git push -u origin codex/avatar-shop-game-experience
   ```

6. Open a draft PR to `main`:

   Title:

   `[codex] Improve avatar shop experience`

   Suggested body:

   ```md
   ## Summary
   - redesign `/universe/shop/avatar` as a game-like avatar room with stage and wardrobe inventory
   - add deterministic product sorting shared by frontend and API
   - bind selected product GLBs into the avatar configurator scene when available
   - show clear 3D-ready vs preview-only product states

   ## Validation
   - `npx.cmd tsc --noEmit --incremental false`
   - `npx.cmd eslint app/universe/shop/avatar/page.tsx components/shop/AvatarConfigurator.tsx app/api/products/route.ts data/products.ts`
   - local `/universe/shop/avatar` returned HTTP 200

   ## Notes
   - lint only reports two existing `<img>` performance warnings
   - some zodiac products do not yet have outfit GLBs: b2, b5, b9, b11
   ```

7. Before merging/deploying, visually QA:

   - desktop
   - tablet
   - mobile
   - click each category
   - select a 3D-ready product and verify outfit appears
   - select a no-3D product and verify the UI clearly says it is preview-only
   - test skin tone selections

