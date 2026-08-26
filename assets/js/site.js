// Site chrome. There is no menu to manage: the home page is the lesson
// list and every lesson ends with a link to the next one, so all that is
// left here is the puzzle progress bar.

import { puzzles } from "../data/lessons.js";
import { solvedCount, resetProgress } from "./progress.js";

export function initSite() {
  initProgress();
}

function initProgress() {
  const bar = document.querySelector("[data-progress]");
  if (!bar) return;
  const ids = puzzles.map((p) => p.id);
  const fill = bar.querySelector(".progress > span");
  const label = bar.querySelector("[data-progress-label]");

  const update = () => {
    const done = solvedCount(ids);
    if (fill) fill.style.width = `${(done / ids.length) * 100}%`;
    if (label) {
      label.textContent =
        done === ids.length
          ? `All ${ids.length} puzzles solved. Outstanding.`
          : `${done} of ${ids.length} puzzles solved`;
    }
  };

  document.addEventListener("puzzle-solved", update);
  const reset = bar.querySelector("[data-progress-reset]");
  if (reset) reset.addEventListener("click", resetProgress);
  update();
}
