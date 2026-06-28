import fs from "node:fs/promises";
import path from "node:path";

// Mapping of UUID files in app_extracted to clean React components
const APP_MAPPING = {
  // Static Data
  "94efafc3-aef0-4ad3-8209-05305b1668e0.javascript": {
    dest: "frontend/src/data/glhData.js",
    type: "data",
    exports: ["CLASSES", "PERSONALITIES", "RANKS", "SKILLS", "SKILL_EDGES", "COURSES", "CALENDAR", "QUIZ", "XP", "CHAR_OPTIONS", "SKILL_META", "COURSE_META", "GLH_DATA"]
  },
  // Game Context Engine
  "7da5b314-de5c-407a-8533-dd298a3ee54a.javascript": {
    dest: "frontend/src/context/GameContext.js",
    type: "context",
    imports: ["import { GLH_DATA } from '@/data/glhData';"]
  },
  // UI & Formatting
  "620d87db-0f90-4fc7-9113-72f56712dbb7.javascript": {
    dest: "frontend/src/components/GLHUI.js",
    type: "ui",
    imports: []
  },
  // Avatar Sprite engine
  "575103b2-867e-44d2-ba92-e148a073977e.javascript": {
    dest: "frontend/src/components/GLHAvatar.js",
    type: "avatar",
    imports: []
  },
  // Common Parts / Modals
  "b88b07f6-4251-4e97-80e7-83a5d630c797.javascript": {
    dest: "frontend/src/components/GLHParts.js",
    type: "parts",
    imports: [
      "import { GLHUI } from './GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ]
  },
  // Login Screen
  "25338b02-b9a9-4723-8c11-3ddecaae9ec5.javascript": {
    dest: "frontend/src/components/screens/Login.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: "Login"
  },
  // Onboarding
  "e2175466-8d76-47b9-9290-7ed5d7af88b4.javascript": {
    dest: "frontend/src/components/screens/Onboarding.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLHAvatar } from '../GLHAvatar';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: ["Onboarding", "CharacterCreation"]
  },
  // Onboarding Steps (Quiz extra steps)
  "4eb71b12-eba0-40de-b626-66d344439417.javascript": {
    dest: "frontend/src/components/screens/OnboardingSteps.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: ["Step4LearningStyle", "Step5Availability", "Step6TrainerPreference"]
  },
  // Quiz & Reveal
  "435d1780-328a-442e-8a1c-5ccc0abb35fe.javascript": {
    dest: "frontend/src/components/screens/QuizReveal.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLHAvatar } from '../GLHAvatar';",
      "import { GLH_DATA } from '@/data/glhData';",
      "import { Step4LearningStyle, Step5Availability, Step6TrainerPreference } from './OnboardingSteps';"
    ],
    screenExport: ["Quiz", "Reveal"]
  },
  // Dashboard
  "2edc550e-a595-4982-b6c3-f2d8c2022597.javascript": {
    dest: "frontend/src/components/screens/Dashboard.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLHAvatar } from '../GLHAvatar';",
      "import { GLH_DATA } from '@/data/glhData';",
      "import { GLHParts } from '../GLHParts';"
    ],
    screenExport: "Dashboard"
  },
  // Constellation
  "e7af09db-eaa1-4300-aa03-5cde8c46cc3a.javascript": {
    dest: "frontend/src/components/screens/Constellation.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: "Constellation"
  },
  // Catalog & Calendar
  "70f5d0b7-444b-4082-88b2-cccfdacec3ab.javascript": {
    dest: "frontend/src/components/screens/CatalogCalendar.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';",
      "import { GLHParts } from '../GLHParts';"
    ],
    screenExport: ["Catalog", "Calendar"]
  },
  // Store
  "7f8c1dae-ab7f-4660-bfee-243af93b82f3.javascript": {
    dest: "frontend/src/components/screens/Store.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: "Store"
  },
  // Policy & Profile
  "5061f20b-b89f-494e-b738-105cb547b0d4.javascript": {
    dest: "frontend/src/components/screens/ProfilePolicy.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLHAvatar } from '../GLHAvatar';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: ["Profile", "Policy"]
  },
  // LdRequest & ChatBot
  "043991ef-ef11-48c6-8c87-1938b1e07408.javascript": {
    dest: "frontend/src/components/screens/LdRequestChatBot.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: ["LdRequestPopup", "ChatBot"]
  },
  // RatingModal & Tutorial
  "b30a8887-7732-4416-98e6-34be0ab699fa.javascript": {
    dest: "frontend/src/components/screens/RatingTutorial.js",
    type: "screen",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLH_DATA } from '@/data/glhData';"
    ],
    screenExport: ["RatingModal", "Tutorial"]
  },
  // Tweaks UI Form Panel
  "d5d5a4cd-b3ed-444a-a873-583ebb2e6614.jsx": {
    dest: "frontend/src/components/TweaksPanel.js",
    type: "tweaks",
    imports: []
  },
  // Root App Page
  "f743d0d5-6214-4ffe-a7da-65e2156c8902.javascript": {
    dest: "frontend/src/app/page.js",
    type: "app",
    imports: [
      "import { GLHEngine } from '@/context/GameContext';",
      "import { GLHUI } from '@/components/GLHUI';",
      "import { GLHAvatar } from '@/components/GLHAvatar';",
      "import { GLHParts } from '@/components/GLHParts';",
      "import { GLH_DATA } from '@/data/glhData';",
      "import { Login } from '@/components/screens/Login';",
      "import { Onboarding, CharacterCreation } from '@/components/screens/Onboarding';",
      "import { Quiz, Reveal } from '@/components/screens/QuizReveal';",
      "import { Profile, Policy } from '@/components/screens/ProfilePolicy';",
      "import { Store } from '@/components/screens/Store';",
      "import { Dashboard } from '@/components/screens/Dashboard';",
      "import { Catalog, Calendar } from '@/components/screens/CatalogCalendar';",
      "import { LdRequestPopup, ChatBot } from '@/components/screens/LdRequestChatBot';",
      "import { RatingModal, Tutorial } from '@/components/screens/RatingTutorial';"
    ]
  },
  // --- Admin files ---
  "a351e174-8767-470f-b6bd-00b29b8113b7.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/data/admData.js",
    type: "admData",
    exports: ["ADMIN_STATS", "ADMIN_COURSES", "ADMIN_SESSIONS", "SESSION_ATTENDEES", "ADMIN_REQUESTS", "ADMIN_POLICIES", "ADMIN_ACCOUNTS", "ADMIN_TESTIMONIALS", "ADMIN_USERS", "USER_ENROLLMENTS"]
  },
  "29a3af28-4e56-447e-8e4a-15a364ee8967.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/components/admin/ADMComponents.js",
    type: "admComponents",
    imports: [
      "import { GLHUI } from '../GLHUI';"
    ]
  },
  "ab267a11-37fc-4e21-8dc8-0155e73c07ff.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/components/admin/ADMScreens1.js",
    type: "admScreens1",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { ADMComponents } from './ADMComponents';",
      "import { ADM_DATA } from '@/data/admData';"
    ]
  },
  "c8747a9f-4693-4475-9f40-7e76406c08c3.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/components/admin/ADMScreens2.js",
    type: "admScreens2",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { ADMComponents } from './ADMComponents';",
      "import { ADM_DATA } from '@/data/admData';"
    ]
  },
  "739ae14c-76cd-4e67-868b-07f74bf1bb08.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/components/admin/ADMScreens3.js",
    type: "admScreens3",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { ADMComponents } from './ADMComponents';",
      "import { ADM_DATA } from '@/data/admData';"
    ]
  },
  "3a35f5cf-d96d-4732-875e-243fceb20e57.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/components/admin/ADMScreensUsers.js",
    type: "admScreensUsers",
    imports: [
      "import { GLHUI } from '../GLHUI';",
      "import { ADMComponents } from './ADMComponents';",
      "import { ADM_DATA } from '@/data/admData';"
    ]
  },
  "db00b9f3-6511-410b-bb00-54cb4938bd8c.javascript": {
    srcDir: "server/static/admin_extracted",
    dest: "frontend/src/app/admin/page.js",
    type: "adminApp",
    imports: [
      "import { ADMComponents } from '@/components/admin/ADMComponents';",
      "import { Dashboard, CoursesScreen } from '@/components/admin/ADMScreens1';",
      "import { SessionsScreen, RequestsScreen } from '@/components/admin/ADMScreens2';",
      "import { PolicyScreen, AccountsScreen, TestimonialsScreen } from '@/components/admin/ADMScreens3';",
      "import { UsersScreen } from '@/components/admin/ADMScreensUsers';"
    ]
  }
};

async function cleanAndMigrateFile(srcName, config) {
  const srcDir = config.srcDir || "server/static/app_extracted";
  const srcPath = path.join(srcDir, srcName);
  let content = await fs.readFile(srcPath, "utf8");

  // 1. Remove IIFE structure cleanly by slicing
  content = content.trim();
  const iifeStart = content.indexOf("(function () {");
  const iifeEnd = content.lastIndexOf("})();");
  if (iifeStart !== -1 && iifeEnd !== -1) {
    content = content.slice(iifeStart + 14, iifeEnd).trim();
  }
  if (content.startsWith('"use strict";') || content.startsWith("'use strict';")) {
    content = content.slice(13).trim();
  }

  // 2. Remove old window.* assignments / declarations
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.GLHUI;?/g, "");
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.GLHEngine;?/g, "");
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.GLHParts;?/g, "");
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.ADMComponents;?/g, "");
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.ADMScreens\d+\b;?/g, "");
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.ADMScreensUsers;?/g, "");
  content = content.replace(/const\s+Avatar\s*=\s*window\.GLHAvatar\.Avatar;?/gi, "");
  content = content.replace(/const\s+D\s*=\s*window\.GLH_DATA;?/gi, "");
  content = content.replace(/const\s+D\s*=\s*window\.ADM_DATA;?/gi, "");
  content = content.replace(/const\s+S\s*=\s*window\.GLHScreens;?/gi, "");

  content = content.replace(/window\.__resources/g, "(typeof window !== \"undefined\" && window.__resources)");

  // Replaces internal references inside App entry point
  if (config.type === "app") {
    content = content.replace(/S\.Login/g, "Login");
    content = content.replace(/S\.Onboarding/g, "Onboarding");
    content = content.replace(/S\.CharacterCreation/g, "CharacterCreation");
    content = content.replace(/S\.Quiz/g, "Quiz");
    content = content.replace(/S\.Reveal/g, "Reveal");
    content = content.replace(/S\.Profile/g, "Profile");
    content = content.replace(/S\.Policy/g, "Policy");
    content = content.replace(/S\.Store/g, "Store");
    content = content.replace(/S\.Dashboard/g, "Dashboard");
    content = content.replace(/S\.Catalog/g, "Catalog");
    content = content.replace(/S\.Calendar/g, "Calendar");
    content = content.replace(/S\.LdRequestPopup/g, "LdRequestPopup");
    content = content.replace(/S\.ChatBot/g, "ChatBot");
    content = content.replace(/S\.RatingModal/g, "RatingModal");
    content = content.replace(/S\.Tutorial/g, "Tutorial");
    content = content.replace(/window\.useTweaks/g, "useTweaks");
    content = content.replace(/window\.TweaksPanel/g, "TweaksPanel");
    content = content.replace(/window\.TweakSection/g, "TweakSection");
    content = content.replace(/window\.TweakRadio/g, "TweakRadio");
    content = content.replace(/window\.TweakSelect/g, "TweakSelect");
    content = content.replace(/window\.TweakSlider/g, "TweakSlider");
    content = content.replace(/window\.TweakToggle/g, "TweakToggle");
    content = content.replace(/window\.TweakButton/g, "TweakButton");
  }

  // 3. Prefix with "use client" for components
  let header = "";
  if (config.type !== "data") {
    header += '"use client";\n\nimport React from "react";\n';
  }

  // 4. Inject ES6 Imports
  if (config.imports && config.imports.length) {
    header += config.imports.join("\n") + "\n";
  }

  // If App, we also import tweaks UI panel elements
  if (config.type === "app") {
    header += "\nimport { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakSlider, TweakToggle, TweakButton } from '@/components/TweaksPanel';\n";
  }

  // 5. Inject local namespace shortcuts
  let shortcuts = "";
  if (config.type === "context") {
    shortcuts += "\nconst D = GLH_DATA;\n";
  } else if (config.type === "parts") {
    shortcuts += "\nconst { Icon, fmtDate, fmtDuration, FORMAT_LABEL } = GLHUI;\n";
    shortcuts += "const { useGame, isRecommended } = GLHEngine;\n";
    shortcuts += "const D = GLH_DATA;\n";
  } else if (config.type === "app") {
    shortcuts += "\nconst { useGame, rankForXp } = GLHEngine;\n";
    shortcuts += "const { Icon } = GLHUI;\n";
    shortcuts += "const { Avatar } = GLHAvatar;\n";
    shortcuts += "const { CourseModal, EventModal } = GLHParts;\n";
    shortcuts += "const D = GLH_DATA;\n";
  } else if (config.type === "screen") {
    shortcuts += "\nconst D = GLH_DATA;\n";
    if (srcName === "25338b02-b9a9-4723-8c11-3ddecaae9ec5.javascript") { // Login
      shortcuts += "const { Icon, Starfield } = GLHUI;\nconst { useGame } = GLHEngine;\n";
    } else if (srcName === "e2175466-8d76-47b9-9290-7ed5d7af88b4.javascript") { // Onboarding
      shortcuts += "const { Icon, Starfield } = GLHUI;\nconst { useGame } = GLHEngine;\nconst { Avatar } = GLHAvatar;\n";
    } else if (srcName === "4eb71b12-eba0-40de-b626-66d344439417.javascript") { // OnboardingSteps
      shortcuts += "const { Icon, Starfield } = GLHUI;\nconst { useGame } = GLHEngine;\n";
    } else if (srcName === "435d1780-328a-442e-8a1c-5ccc0abb35fe.javascript") { // QuizReveal
      shortcuts += "const { Icon, Starfield } = GLHUI;\nconst { useGame, scoreQuiz, rankForXp } = GLHEngine;\nconst { Avatar } = GLHAvatar;\n";
    } else if (srcName === "2edc550e-a595-4982-b6c3-f2d8c2022597.javascript") { // Dashboard
      shortcuts += "const { Icon, fmtDate } = GLHUI;\nconst { useGame, rankForXp, nextRankForXp, levelProgress, recommendCourses, upcomingEvents } = GLHEngine;\nconst { Avatar } = GLHAvatar;\nconst { CourseCard } = GLHParts;\n";
    } else if (srcName === "e7af09db-eaa1-4300-aa03-5cde8c46cc3a.javascript") { // Constellation
      shortcuts += "const { Icon, Starfield } = GLHUI;\nconst { useGame, skillStatus } = GLHEngine;\n";
    } else if (srcName === "70f5d0b7-444b-4082-88b2-cccfdacec3ab.javascript") { // CatalogCalendar
      shortcuts += "const { Icon, fmtDate, FORMAT_LABEL, MONTHS_VI, DOW_VI } = GLHUI;\nconst { useGame, isRecommended } = GLHEngine;\nconst { CourseCard } = GLHParts;\n";
    } else if (srcName === "7f8c1dae-ab7f-4660-bfee-243af93b82f3.javascript") { // Store
      shortcuts += "const { Icon } = GLHUI;\nconst { useGame } = GLHEngine;\n";
    } else if (srcName === "5061f20b-b89f-494e-b738-105cb547b0d4.javascript") { // ProfilePolicy
      shortcuts += "const { Icon, fmtDate } = GLHUI;\nconst { useGame, rankForXp } = GLHEngine;\nconst { Avatar } = GLHAvatar;\n";
    } else if (srcName === "043991ef-ef11-48c6-8c87-1938b1e07408.javascript") { // LdRequestChatBot
      shortcuts += "const { Icon } = GLHUI;\nconst { useGame } = GLHEngine;\n";
    } else if (srcName === "b30a8887-7732-4416-98e6-34be0ab699fa.javascript") { // RatingTutorial
      shortcuts += "const { Icon } = GLHUI;\nconst { useGame } = GLHEngine;\n";
    }
  } else if (config.type === "admComponents") {
    shortcuts += "\nconst { Icon } = GLHUI;\n";
  } else if (config.type === "admScreens1" || config.type === "admScreens2" || config.type === "admScreens3" || config.type === "admScreensUsers") {
    shortcuts += "\nconst { Icon } = GLHUI;\n";
    shortcuts += "const { Badge, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput } = ADMComponents;\n";
    shortcuts += "const D = ADM_DATA;\n";
  } else if (config.type === "adminApp") {
    shortcuts += "\nconst { Sidebar } = ADMComponents;\n";
  }

  content = header + shortcuts + "\n" + content;

  // 6. Replace export lines
  if (config.type === "data") {
    content = content.replace(/window\.GLH_DATA\s*=\s*\{([\s\S]*?)\};?/g, "export const GLH_DATA = {$1};");
    config.exports.forEach((exp) => {
      content = content.replace(new RegExp(`(?<!export\\s+)const\\s+${exp}\\s*=`, "g"), `export const ${exp} =`);
    });
  } else if (config.type === "admData") {
    content = content.replace(/window\.ADM_DATA\s*=\s*\{([\s\S]*?)\};?/g, "export const ADM_DATA = {$1};");
    config.exports.forEach((exp) => {
      content = content.replace(new RegExp(`(?<!export\\s+)const\\s+${exp}\\s*=`, "g"), `export const ${exp} =`);
    });
  } else if (config.type === "context") {
    content = content.replace(/window\.GLHEngine\s*=\s*\{([\s\S]*?)\};?/g, "export const GLHEngine = {$1};");
    content = content.replace("const GameContext = React.createContext(null);", "export const GameContext = React.createContext(null);");
    content = content.replace("export const useGame = () => React.useContext(GameContext);", "");
    content = content.replace("function useGame()", "export function useGame()");
    content = content.replace("function GameProvider(props)", "export function GameProvider(props)");
  } else if (config.type === "ui") {
    content = content.replace(/window\.GLHUI\s*=\s*\{([\s\S]*?)\};?/g, "export const GLHUI = {$1};");
    content = content.replace("function Icon(props)", "export function Icon(props)");
    content = content.replace("function Starfield(props)", "export function Starfield(props)");
    content = content.replace("function fmtDate(d, format)", "export function fmtDate(d, format)");
    content = content.replace("function fmtDuration(m)", "export function fmtDuration(m)");
    content = content.replace("const MONTHS_VI =", "export const MONTHS_VI =");
    content = content.replace("const DOW_VI =", "export const DOW_VI =");
    content = content.replace("const FORMAT_LABEL =", "export const FORMAT_LABEL =");
  } else if (config.type === "avatar") {
    content = content.replace(/window\.GLHAvatar\s*=\s*\{([\s\S]*?)\};?/g, "export const GLHAvatar = {$1};");
    content = content.replace("function svg(opts)", "export function svg(opts)");
    content = content.replace("function Avatar(props)", "export function Avatar(props)");
    content = content.replace("const OUTFIT =", "export const OUTFIT =");
    content = content.replace("const SKIN =", "export const SKIN =");
  } else if (config.type === "parts") {
    content = content.replace(/window\.GLHParts\s*=\s*\{([\s\S]*?)\};?/g, "export const GLHParts = {$1};");
    content = content.replace("function CourseCard(props)", "export function CourseCard(props)");
    content = content.replace("function CourseModal(props)", "export function CourseModal(props)");
    content = content.replace("function EventModal(props)", "export function EventModal(props)");
    content = content.replace("function DetailItem(props)", "export function DetailItem(props)");
    content = content.replace("function SkillPill(props)", "export function SkillPill(props)");
    content = content.replace("function Stars(props)", "export function Stars(props)");
  } else if (config.type === "screen") {
    if (Array.isArray(config.screenExport)) {
      config.screenExport.forEach((exp) => {
        content = content.replace(new RegExp(`function\\s+${exp}\\b`, "g"), `export function ${exp}`);
      });
      content = content.replace(/window\.GLHScreens\s*=\s*Object\.assign\([\s\S]*?\);?/gi, "");
    } else {
      content = content.replace(new RegExp(`function\\s+${config.screenExport}\\b`, "g"), `export function ${config.screenExport}`);
      content = content.replace(/window\.GLHScreens\s*=\s*Object\.assign\([\s\S]*?\);?/gi, "");
    }
  } else if (config.type === "tweaks") {
    content = content.replace("function useTweaks(defaults)", "export function useTweaks(defaults)");
    content = content.replace("function TweaksPanel({ title = 'Tweaks', children })", "export function TweaksPanel({ title = 'Tweaks', children })");
    content = content.replace("function TweakSection({ label, children })", "export function TweakSection({ label, children })");
    content = content.replace("function TweakRow({ label, value, children, inline = false })", "export function TweakRow({ label, value, children, inline = false })");
    content = content.replace("function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange })", "export function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange })");
    content = content.replace("function TweakToggle({ label, value, onChange })", "export function TweakToggle({ label, value, onChange })");
    content = content.replace("function TweakRadio({ label, value, options, onChange })", "export function TweakRadio({ label, value, options, onChange })");
    content = content.replace("function TweakSelect({ label, value, options, onChange })", "export function TweakSelect({ label, value, options, onChange })");
    content = content.replace("function TweakText({ label, value, placeholder, onChange })", "export function TweakText({ label, value, placeholder, onChange })");
    content = content.replace("function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange })", "export function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange })");
    content = content.replace("function TweakColor({ label, value, options, onChange })", "export function TweakColor({ label, value, options, onChange })");
    content = content.replace("function TweakButton({ label, onClick, secondary = false })", "export function TweakButton({ label, onClick, secondary = false })");
    content = content.replace(/Object\.assign\(window,\s*\{([\s\S]*?)\}\);?/g, "");
  } else if (config.type === "app") {
    const mountIndex = content.indexOf("const root =");
    if (mountIndex !== -1) content = content.slice(0, mountIndex).trim();
    content = content.replace("function App()", "export default function App()");
    content = content.replace("function AppInner() {", 'function AppInner() {\n    const [mounted, setMounted] = React.useState(false);\n    React.useEffect(() => { setMounted(true); }, []);\n');
    content = content.replace("let body;", 'if (!mounted) return null;\n    let body;');
    content = content.replace(/return\s+localStorage\.getItem\(\s*(["'])glh_theme\1\s*\)\s*!==\s*(["'])light\2;?/g, 'try { if (typeof window !== "undefined") { return localStorage.getItem("glh_theme") !== "light"; } } catch(e) {} return true;');
    content = content.replace(/return\s+!localStorage\.getItem\(\s*(["'])glh_tutorial_done\1\s*\);?/g, 'try { if (typeof window !== "undefined") { return !localStorage.getItem("glh_tutorial_done"); } } catch(e) {} return false;');
  } else if (config.type === "admComponents") {
    content = content.replace(/window\.ADMComponents\s*=\s*\{([\s\S]*?)\};?/g, "export const ADMComponents = {$1};");
    content = content.replace("function Badge(props)", "export function Badge(props)");
    content = content.replace("function Sidebar(props)", "export function Sidebar(props)");
    content = content.replace("function PageHeader(props)", "export function PageHeader(props)");
    content = content.replace("function StatCard(props)", "export function StatCard(props)");
    content = content.replace("function SectionCard(props)", "export function SectionCard(props)");
    content = content.replace("function Modal(props)", "export function Modal(props)");
    content = content.replace("function Toggle(props)", "export function Toggle(props)");
    content = content.replace("function SearchInput(props)", "export function SearchInput(props)");
  } else if (config.type === "admScreens1") {
    content = content.replace(/window\.ADMScreens1\s*=\s*\{([\s\S]*?)\};?/g, "export const ADMScreens1 = {$1};");
    content = content.replace("function Dashboard()", "export function Dashboard()");
    content = content.replace("function CoursesScreen()", "export function CoursesScreen()");
  } else if (config.type === "admScreens2") {
    content = content.replace(/window\.ADMScreens2\s*=\s*\{([\s\S]*?)\};?/g, "export const ADMScreens2 = {$1};");
    content = content.replace("function SessionsScreen()", "export function SessionsScreen()");
    content = content.replace("function RequestsScreen()", "export function RequestsScreen()");
  } else if (config.type === "admScreens3") {
    content = content.replace(/window\.ADMScreens3\s*=\s*\{([\s\S]*?)\};?/g, "export const ADMScreens3 = {$1};");
    content = content.replace("function PolicyScreen()", "export function PolicyScreen()");
    content = content.replace("function AccountsScreen()", "export function AccountsScreen()");
    content = content.replace("function TestimonialsScreen()", "export function TestimonialsScreen()");
  } else if (config.type === "admScreensUsers") {
    content = content.replace(/window\.ADMScreensUsers\s*=\s*\{([\s\S]*?)\};?/g, "export const ADMScreensUsers = {$1};");
    content = content.replace("function UsersScreen()", "export function UsersScreen()");
  } else if (config.type === "adminApp") {
    const mountIndex = content.indexOf("const root =");
    if (mountIndex !== -1) content = content.slice(0, mountIndex).trim();
    content = content.replace("function AdminApp()", "export default function AdminApp()");
    content = content.replace("function AdminApp() {", 'function AdminApp() {\n    const [mounted, setMounted] = React.useState(false);\n    React.useEffect(() => { setMounted(true); }, []);\n');
    content = content.replace("const screens = {", 'if (!mounted) return null;\n    const screens = {');
    content = content.replace(/(\(\)\s*=>\s*localStorage\.getItem\(\s*(["'])adm_page\2\s*\)\s*\|\|\s*(["'])dashboard\3)/g, '() => { try { if (typeof window !== "undefined") { return localStorage.getItem("adm_page") || "dashboard"; } } catch (e) {} return "dashboard"; }');
  }
  content = content.replace(/window\.GLH_DATA/g, "GLH_DATA");
  content = content.replace(/window\.ADM_DATA/g, "ADM_DATA");
  content = content.replace(/window\.GLHEngine/g, "GLHEngine");
  content = content.replace(/window\.GLHUI/g, "GLHUI");
  content = content.replace(/window\.GLHAvatar/g, "GLHAvatar");
  content = content.replace(/window\.GLHParts/g, "GLHParts");
  content = content.replace(/const\s+\{[a-zA-Z0-9_\s,]*?\}\s*=\s*window\.GLHScreens;?/gi, "");
  content = content.replace(/window\.GLHScreens/g, "GLHScreens");

  // Create directory if not exists
  const dir = path.dirname(config.dest);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(config.dest, content);
  console.log(`Migrated: ${srcName} -> ${config.dest}`);
}

async function run() {
  for (const [srcName, config] of Object.entries(APP_MAPPING)) {
    await cleanAndMigrateFile(srcName, config);
  }
  console.log("\nCode migration completed successfully!");
}

run().catch(console.error);
