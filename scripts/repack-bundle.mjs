// Repack a Claude artifact bundle with modified assets
import fs from "node:fs/promises";
import zlib from "node:zlib";
import { promisify } from "node:util";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile;
if (!inputFile) { console.error("Usage: node repack-bundle.mjs <input.dat> [output.dat]"); process.exit(1); }

const extractDir = inputFile.replace(/\.[^.]+$/, "") + "_extracted";

const html = await fs.readFile(inputFile, "utf8");

const manifestMatch = html.match(/(<script[^>]*type="__bundler\/manifest"[^>]*>)([\s\S]*?)(<\/script>)/);
if (!manifestMatch) { console.error("No manifest found"); process.exit(1); }

const manifest = JSON.parse(manifestMatch[2]);
let changed = 0;

for (const [uuid, entry] of Object.entries(manifest)) {
  const ext = entry.mime?.split("/")[1]?.split(";")[0] || "bin";
  const modifiedFile = `${extractDir}/${uuid}.${ext}`;

  let modifiedContent;
  try {
    modifiedContent = await fs.readFile(modifiedFile);
  } catch {
    continue; // file not modified
  }

  // Compare with original
  const originalBytes = Buffer.from(entry.data, "base64");
  let originalContent;
  if (entry.compressed) {
    originalContent = await gunzip(originalBytes);
  } else {
    originalContent = originalBytes;
  }

  if (modifiedContent.equals(originalContent)) continue; // no change

  // Recompress and re-encode
  let newBytes;
  if (entry.compressed) {
    newBytes = await gzip(modifiedContent, { level: 9 });
  } else {
    newBytes = modifiedContent;
  }
  entry.data = newBytes.toString("base64");
  changed++;
  console.log(`Updated: ${uuid}.${ext} (${originalContent.length} → ${modifiedContent.length} bytes)`);
}

if (changed === 0) {
  console.log("No changes detected.");
  process.exit(0);
}

const newManifestJson = JSON.stringify(manifest);
const newHtml = html.replace(
  manifestMatch[0],
  manifestMatch[1] + newManifestJson + manifestMatch[3]
);

await fs.writeFile(outputFile, newHtml);
console.log(`\nRepacked ${changed} asset(s) → ${outputFile}`);
