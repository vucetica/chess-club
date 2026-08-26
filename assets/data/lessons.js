// One lookup table for every walkthrough and puzzle on the site.
// Pages refer to entries by "topic/id", e.g. data-lesson="openings/italian".

import { openings } from "./openings.js";
import { checkmates } from "./checkmates.js";
import { rules } from "./rules.js";
import { tactics } from "./tactics.js";
import { endgames } from "./endgames.js";
import { puzzles, puzzleGroups } from "./puzzles.js";

const puzzleMap = {};
for (const p of puzzles) puzzleMap[p.id] = p;

export const LESSONS = {
  openings,
  checkmates,
  rules,
  tactics,
  endgames,
  puzzles: puzzleMap,
};

export { puzzles, puzzleGroups };

export function findLesson(path) {
  if (!path) return null;
  const [topic, id] = path.split("/");
  const group = LESSONS[topic];
  return (group && group[id]) || null;
}
