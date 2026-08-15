/**
 * Run once: node scripts/generate-icons.mjs
 * Generates all required PWA icon sizes from public/assets/images/favicon.png
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "public", "icons", "fw-logo.png");
const outDir = join(root, "public", "icons");

mkdirSync(outDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(join(outDir, `icon-${size}x${size}.png`));
  console.log(`Generated icon-${size}x${size}.png`);
}

// Maskable icons (add safe-zone padding ~10%)
const pad = (size) => Math.round(size * 0.1);
for (const size of [192, 512]) {
  const inner = size - pad(size) * 2;
  await sharp(src)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: pad(size), bottom: pad(size),
      left: pad(size), right: pad(size),
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(join(outDir, `icon-maskable-${size}x${size}.png`));
  console.log(`Generated icon-maskable-${size}x${size}.png`);
}

console.log("All icons generated in public/icons/");
