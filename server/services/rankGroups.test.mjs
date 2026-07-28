import assert from "node:assert/strict";
import { RANK_GROUPS, ranksForUser, rankGroupForUser } from "./rankGroups.js";

assert.equal(rankGroupForUser({ role: "Marketing", rank: "Assistant Manager" }), RANK_GROUPS.GENERAL);
assert.equal(rankGroupForUser({ role: "Game Development", rank: "Assistant Manager" }), RANK_GROUPS.GENERAL);
assert.equal(rankGroupForUser({ role: "Corporate IT", rank: "Associate" }), RANK_GROUPS.CORP_IT);
assert.equal(rankGroupForUser({ role: "Backend", rank: "Expert Engineer" }), RANK_GROUPS.TECH_GAME);
assert.equal(rankGroupForUser({ role: "PM", rank: "Senior Product Management Associate II" }), RANK_GROUPS.TECH_GAME);
assert.ok(ranksForUser({ role: "PM", rank: "Senior Product Management Associate II" }).includes("Senior Product Management Associate III"));

console.log("rankGroups.test.mjs: all assertions passed");
