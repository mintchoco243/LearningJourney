// Extract all JS assets from a Claude artifact bundle for inspection
import fs from "node:fs/promises";
import zlib from "node:zlib";
import { promisify } from "node:util";

const gunzip = promisify(zlib.gunzip);

const file = process.argv[2];
if (!file) { console.error("Usage: node extract-bundle.mjs <file.dat>"); process.exit(1); }

const html = await fs.readFile(file, "utf8");

// Extract manifest JSON
const manifestMatch = html.match(/<script[^>]*type="__bundler\/manifest"[^>]*>([\s\S]*?)<\/script>/);
if (!manifestMatch) { console.error("No manifest found"); process.exit(1); }

const manifest = JSON.parse(manifestMatch[1]);
const entries = Object.entries(manifest);
console.log(`Found ${entries.length} assets in manifest`);

const outDir = file.replace(/\.[^.]+$/, "") + "_extracted";
await fs.mkdir(outDir, { recursive: true });

for (const [uuid, entry] of entries) {
  const bytes = Buffer.from(entry.data, "base64");
  let content;
  if (entry.compressed) {
    content = await gunzip(bytes);
  } else {
    content = bytes;
  }

  const ext = entry.mime?.split("/")[1]?.split(";")[0] || "bin";
  const outFile = `${outDir}/${uuid}.${ext}`;
  await fs.writeFile(outFile, content);

  const isText = ["javascript", "css", "html", "json", "text"].some(t => (entry.mime || "").includes(t));
  if (isText) {
    const text = content.toString("utf8");
    const preview = text.slice(0, 200).replace(/\n/g, "↵");
    console.log(`[${ext}] ${uuid}: ${content.length} bytes — ${preview}`);
  } else {
    console.log(`[${ext}] ${uuid}: ${content.length} bytes (binary)`);
  }
}
console.log(`\nExtracted to: ${outDir}`);
