/**
 * optimize-product-videos.mjs
 *
 * public/products/<burç>/ altındaki gerçek çekim videolarını (kova.mp4,
 * balık.mp4, koc.mp4 …) web için sıkıştırır. Orijinaller 12-18 MB; PDP'de
 * "Hikâyeyi Yaşa" tıklanınca akıcı oynaması için küçültülür.
 *
 *   • en geniş kenar 1080px'e indirilir (oran korunur)
 *   • ses kaldırılır (muted oynuyor)
 *   • H.264 + faststart (akış için baş bilgi başa alınır)
 *   • dosya adı KORUNUR (Türkçe karakter dahil) → koddaki yollar değişmez
 *
 * Orijinaller public/products/_raw/<burç>/ klasörüne yedeklenir.
 *
 * Kullanım:
 *   node scripts/optimize-product-videos.mjs            # hepsini sıkıştır
 *   node scripts/optimize-product-videos.mjs --crf 24   # daha yüksek kalite
 *   node scripts/optimize-product-videos.mjs --dry-run  # sadece raporla
 *   FFMPEG=/yol/ffmpeg node scripts/optimize-product-videos.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "products");
const RAW_ROOT = join(ROOT, "_raw");
const VIDEO_RE = /\.(mp4|mov|m4v|webm)$/i;
// Bu boyutun altındakiler zaten optimize sayılır, atlanır.
const SKIP_UNDER_MB = 6;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const crfIdx = args.indexOf("--crf");
const CRF = crfIdx >= 0 ? args[crfIdx + 1] : "26";

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
  console.log(`CRF:${CRF}  •  ${zodiacs.length} burç${dryRun ? "  (DRY-RUN)" : ""}\n`);

  let before = 0;
  let after = 0;
  let done = 0;
  let skipped = 0;

  for (const z of zodiacs) {
    const dir = join(ROOT, z);
    const files = readdirSync(dir).filter((f) => VIDEO_RE.test(f)).sort();
    if (files.length === 0) continue;

    const rawDir = join(RAW_ROOT, z);

    for (const name of files) {
      const src = join(dir, name);
      const srcSize = statSync(src).size;

      if (srcSize < SKIP_UNDER_MB * 1024 * 1024) {
        skipped++;
        continue;
      }

      before += srcSize;

      if (dryRun) {
        console.log(`• ${z}/${name}  (${MB(srcSize)} MB)`);
        continue;
      }

      if (!existsSync(rawDir)) mkdirSync(rawDir, { recursive: true });

      const tmp = join(dir, `${name}.opt.mp4`);
      try {
        execFileSync(
          FFMPEG,
          [
            "-y",
            "-i", src,
            "-an",
            "-vf", "scale='min(1080,iw)':-2",
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", String(CRF),
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            tmp,
          ],
          { stdio: ["ignore", "ignore", "ignore"] },
        );
      } catch (err) {
        console.error(`✗ ${z}/${name} — ffmpeg hata:`, err.message);
        continue;
      }

      const optSize = statSync(tmp).size;
      renameSync(src, join(rawDir, name)); // orijinali yedekle
      renameSync(tmp, src); // optimize edileni asıl ismine taşı
      after += optSize;
      done++;

      const saved = (100 * (1 - optSize / srcSize)).toFixed(0);
      console.log(`✓ ${z}/${name}  ${MB(srcSize)} → ${MB(optSize)} MB  (-%${saved})`);
    }
  }

  if (dryRun) {
    console.log(`\nSıkıştırılacak: ${MB(before)} MB  •  atlanan: ${skipped}`);
  } else {
    console.log(
      `\nToplam: ${MB(before)} MB → ${MB(after)} MB  (-%${before ? (100 * (1 - after / before)).toFixed(0) : 0})  •  ${done} video  •  atlanan: ${skipped}`,
    );
    console.log(`Orijinaller: ${RAW_ROOT}`);
  }
}

run();
