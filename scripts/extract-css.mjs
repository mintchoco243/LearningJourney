import fs from "node:fs/promises";

function extractStylesFromHtml(rawHtml) {
  const templateTagStart = rawHtml.indexOf('<script type="__bundler/template">');
  if (templateTagStart === -1) return "";
  const templateTagEnd = rawHtml.indexOf('</script>', templateTagStart);
  if (templateTagEnd === -1) return "";
  
  const jsonStr = rawHtml.slice(templateTagStart + '<script type="__bundler/template">'.length, templateTagEnd).trim();
  const parsedHtml = JSON.parse(jsonStr);

  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styles = "";
  let match;
  while ((match = styleRegex.exec(parsedHtml)) !== null) {
    const content = match[1].trim();
    if (content && !content.includes("__bundler_loading")) {
      styles += content + "\n\n";
    }
  }

  // Prepend / to relative UUID URLs so Next.js resolves them against the public directory
  const uuidUrlRegex = /url\(['"]?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]?\)/gi;
  styles = styles.replace(uuidUrlRegex, 'url("/$1")');

  return styles;
}

async function run() {
  const appRaw = await fs.readFile("server/static/app.dat", "utf8");
  const adminRaw = await fs.readFile("server/static/admin.dat", "utf8");

  const appStyles = extractStylesFromHtml(appRaw);
  const adminStyles = extractStylesFromHtml(adminRaw);

  // Let's write them
  await fs.writeFile("frontend/src/app/globals.css", appStyles);
  await fs.writeFile("frontend/src/app/admin.css", adminStyles);

  console.log("CSS extraction successful!");
  console.log("- Written frontend/src/app/globals.css");
  console.log("- Written frontend/src/app/admin.css");
}

run().catch(console.error);
