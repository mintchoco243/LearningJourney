import fs from "node:fs/promises";

async function run() {
  const adminHtml = await fs.readFile("server/static/admin.dat", "utf8");
  const templateTagStart = adminHtml.indexOf('<script type="__bundler/template">');
  if (templateTagStart === -1) {
    console.log("No template tag found");
    return;
  }
  const content = adminHtml.slice(templateTagStart, templateTagStart + 2000);
  console.log(content);
}

run();
