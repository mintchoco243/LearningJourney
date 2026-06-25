export async function sendMail({ to, subject, html, text }) {
  console.log(`\n==================================================`);
  console.log(`📧 [EMAIL SENT]`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`👤 To: ${to}`);
  console.log(`📝 Subject: ${subject}`);
  if (text) console.log(`📄 Content (Text): ${text}`);
  if (html) console.log(`🌐 Content (HTML): ${html.substring(0, 300)}${html.length > 300 ? "..." : ""}`);
  console.log(`==================================================\n`);
  return { success: true };
}
