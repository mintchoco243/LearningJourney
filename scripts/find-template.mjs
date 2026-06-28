import fs from "node:fs/promises";

async function run() {
  const appHtml = await fs.readFile("server/static/app.dat", "utf8");
  const templateTagStart = appHtml.indexOf('<script type="__bundler/template">');
  if (templateTagStart === -1) {
    console.log("No template tag found");
    return;
  }
  const content = appHtml.slice(templateTagStart, templateTagStart + 2000);
  console.log(content);
}

run();
