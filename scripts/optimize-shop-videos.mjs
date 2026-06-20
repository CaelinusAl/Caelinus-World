/**
 * optimize-shop-videos.mjs
 *
 * public/play/shop/ altındaki *-look.mp4 burç videolarını web için
 * sıkıştırır:
 *   • en geniş kenar 1080px'e indirilir (oran korunur)
 *   • ses kaldırılır (zaten muted oynuyor)
 *   • H.264 + faststart (akış için baş bilgisi başa alınır)
 *
 * Orijinaller public/play/shop/_raw/ klasörüne yedeklenir; istersen geri
 * alabilirsin. Optimize edilen dosya aynı isimle yazılır, kodda hiçbir
 * yol değişmez.
 *
 * Kullanım:
 *   node scripts/optimize-shop-videos.mjs            # hepsini sıkıştır
 *   node scripts/optimize-shop-videos.mjs --crf 28   # daha yüksek kalite
 *   node scripts/optimize-shop-videos.mjs --dry-run  # sadece raporla
 *   FFMPEG=/yol/ffmpeg node scripts/optimize-shop-videos.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

const SHOP_DIR = join(process.cwd(), "public", "play", "shop");
const RAW_DIR = join(SHOP_DIR, "_raw");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const crfIdx = args.indexOf("--crf");
const CRF = crfIdx >= 0 ? args[crfIdx + 1] : "30";

function resolveFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  // winget (Gyan.FFmpeg) varsayılan kurulum yeri
  const base = join(
    process.env.LOCALAPPDATA ?? "",
    "Microsoft",
    "WinGet",
    "Packages",
  );
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
  return "ffmpeg"; // PATH'te olduğunu varsay
}

const FFMPEG = resolveFfmpeg();
const MB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

function run() {
  if (!existsSync(SHOP_DIR)) {
    console.error("Klasör yok:", SHOP_DIR);
    process.exit(1);
  }

  const files = readdirSync(SHOP_DIR)
    .filter((f) => f.endsWith("-look.mp4"))
    .sort();

  if (files.length === 0) {
    console.log("Sıkıştırılacak *-look.mp4 bulunamadı.");
    return;
  }

  console.log(`ffmpeg: ${FFMPEG}`);
  console.log(`CRF: ${CRF}  •  ${files.length} dosya${dryRun ? "  (DRY-RUN)" : ""}\n`);

  if (!dryRun && !existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });

  let before = 0;
  let after = 0;

  for (const name of files) {
    const src = join(SHOP_DIR, name);
    const srcSize = statSync(src).size;
    before += srcSize;

    if (dryRun) {
      console.log(`• ${name}  (${MB(srcSize)} MB)`);
      continue;
    }

    const tmp = join(SHOP_DIR, `${name}.opt.mp4`);
    try {
      execFileSync(
        FFMPEG,
        [
          "-y",
          "-i", src,
          "-an",
          "-vf", "scale='min(1080,iw)':-2",
          "-r", "30",
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
      console.error(`✗ ${name} — ffmpeg hata:`, err.message);
      continue;
    }

    const optSize = statSync(tmp).size;
    // Orijinali yedekle, optimize edileni asıl isme taşı
    renameSync(src, join(RAW_DIR, name));
    renameSync(tmp, src);
    after += optSize;

    const saved = (100 * (1 - optSize / srcSize)).toFixed(0);
    console.log(`✓ ${name}  ${MB(srcSize)} → ${MB(optSize)} MB  (-%${saved})`);
  }

  if (!dryRun) {
    console.log(
      `\nToplam: ${MB(before)} MB → ${MB(after)} MB  (-%${(100 * (1 - after / before)).toFixed(0)})`,
    );
    console.log(`Orijinaller: ${RAW_DIR}`);
  } else {
    console.log(`\nToplam: ${MB(before)} MB`);
  }
}

run();
