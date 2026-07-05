const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.js', 'utf8');

const target1 = `      phase === "app" ? React.createElement(ChatBot, { hideOnGameWorld: true }) : null,`;
const target2 = `        React.createElement(Icon, { name: "star", size: 14, color: "var(--amber)" }), " Đánh giá"
      ) : null,`;

let i1 = content.indexOf(target1);
let i2 = content.indexOf(target2);

if (i1 > -1 && i2 > -1) {
  let toReplace = content.substring(i1, i2 + target2.length);
  
  const repl = `      !["login", "onboarding", "character", "quiz"].includes(phase) ? React.createElement("div", {
        style: {
          position: "fixed", bottom: 24, right: 24, zIndex: 98,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12
        }
      },
        React.createElement("button", {
          onClick: () => setShowRating(true),
          title: "Đánh giá site",
          style: {
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)", transition: "all 200ms", padding: 0
          },
          onMouseEnter: (e) => { e.currentTarget.style.borderColor = "var(--glh-accent)"; e.currentTarget.style.transform = "scale(1.08)"; },
          onMouseLeave: (e) => { e.currentTarget.style.borderColor = "var(--rpg-border)"; e.currentTarget.style.transform = "scale(1)"; },
        }, React.createElement(Icon, { name: "star", size: 24, color: "var(--amber)" })),
        React.createElement(ChatBot, { hideOnGameWorld: true })
      ) : null,`;

  content = content.replace(toReplace, repl);
  fs.writeFileSync('frontend/src/app/page.js', content);
  console.log('Success');
} else {
  console.log('Not found', i1, i2);
}
