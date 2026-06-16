/**
 * optimize-product-photos.mjs
 *
 * public/products/<burç>/ altındaki gerçek model çekimlerini (IMG_*.JPG vb.)
 * web için küçültür. Bu fotoğraflar PDP galerisinde "Gerçek Çekim" karelerinde
 * kullanılıyor; orijinaller 4-6 MB olduğundan tek ürün sayfası 30+ MB indirir.
 *
 *   • en uzun kenar 1600px'e indirilir (oran korunur)
 *   • JPEG kalite ~3 (görsel olarak kayıpsıza yakın, ~%90 küçülme)
 *   • dosya adı KORUNUR → koddaki yollar değişmez
 *
 * Orijinaller public/products/_raw/<burç>/ klasörüne yedeklenir.
 *
 * Kullanım:
 *   node scripts/optimize-product-photos.mjs            # hepsini küçült
 *   node scripts/optimize-product-photos.mjs --q 4      # daha çok sıkıştır
 *   node scripts/optimize-product-photos.mjs --dry-run  # sadece raporla
 *   node scripts/optimize-product-photos.mjs --max 2000 # farklı uzun kenar
 *   FFMPEG=/yol/ffmpeg node scripts/optimize-product-photos.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "products");
const RAW_ROOT = join(ROOT, "_raw");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const qIdx = args.indexOf("--q");
const Q = qIdx >= 0 ? args[qIdx + 1] : "3";
const maxIdx = args.indexOf("--max");
const MAX = maxIdx >= 0 ? args[maxIdx + 1] : "1600";
// Bu boyutun altındaki dosyalar zaten optimize sayılır, atlanır.
const SKIP_UNDER_KB = 600;

function resolveFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  const base = join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  if (existsSync(base)) {
    const stack = [base];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.name.toLowerCase() === "ffmpeg.exe") return full;
      }
    }
  }
  return "ffmpeg";
}

const FFMPEG = resolveFfmpeg();
const MB = (bytes) => (bytes / 1024 / 1024).toFixed(1);
const isImg = (f) => /\.(jpe?g|png)$/i.test(f);

function run() {
  if (!existsSync(ROOT)) {
    console.error("Klasör yok:", ROOT);
    process.exit(1);
  }

  const zodiacs = readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "_raw")
    .map((e) => e.name)
    .sort();

  console.log(`ffmpeg: ${FFMPEG}`);
  console.log(`q:${Q}  max:${MAX}px  •  ${zodiacs.length} burç${dryRun ? "  (DRY-RUN)" : ""}\n`);

  // Uzun kenarı MAX'a indir (oran korunur), zaten küçükse büyütme.
  const vf = `scale='min(${MAX},iw)':'min(${MAX},ih)':force_original_aspect_ratio=decrease`;

  let before = 0;
  let after = 0;
  let done = 0;
  let skipped = 0;

  for (const z of zodiacs) {
    const dir = join(ROOT, z);
    const files = readdirSync(dir).filter(isImg).sort();
    if (files.length === 0) continue;

    const rawDir = join(RAW_ROOT, z);
    if (!dryRun && files.some((f) => statSync(join(dir, f)).size >= SKIP_UNDER_KB * 1024)) {
      mkdirSync(rawDir, { recursive: true });
    }

    for (const name of files) {
      const src = join(dir, name);
      const srcSize = statSync(src).size;

      if (srcSize < SKIP_UNDER_KB * 1024) {
        skipped++;
        continue;
      }

      before += srcSize;

      if (dryRun) {
        console.log(`• ${z}/${name}  (${MB(srcSize)} MB)`);
        continue;
      }

      const tmp = join(dir, `${name}.opt.jpg`);
      try {
        execFileSync(
          FFMPEG,
          ["-y", "-i", src, "-vf", vf, "-q:v", String(Q), tmp],
          { stdio: ["ignore", "ignore", "ignore"] },
        );
      } catch (err) {
        console.error(`✗ ${z}/${name} — ffmpeg hata:`, err.message);
        continue;
      }

      const optSize = statSync(tmp).size;
      renameSync(src, join(rawDir, name));
      renameSync(tmp, src);
      after += optSize;
      done++;

      const saved = (100 * (1 - optSize / srcSize)).toFixed(0);
      console.log(`✓ ${z}/${name}  ${MB(srcSize)} → ${MB(optSize)} MB  (-%${saved})`);
    }
  }

  if (dryRun) {
    console.log(`\nKüçültülecek: ${MB(before)} MB  •  atlanan (zaten küçük): ${skipped}`);
  } else {
    console.log(
      `\nToplam: ${MB(before)} MB → ${MB(after)} MB  (-%${before ? (100 * (1 - after / before)).toFixed(0) : 0})  •  ${done} dosya  •  atlanan: ${skipped}`,
    );
    console.log(`Orijinaller: ${RAW_ROOT}`);
  }
}

run();
