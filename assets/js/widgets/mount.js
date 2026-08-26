// Turns declarative markup into live boards.
//
//   <figure data-widget="explorer" data-fen="…"></figure>
//   <figure data-widget="stepper"  data-lesson="openings/italian"></figure>
//   <figure data-widget="puzzle"   data-lesson="puzzles/m1-01"></figure>

import { findLesson } from "../../data/lessons.js";
import { createExplorer } from "./explorer.js";
import { createStepper } from "./stepper.js";
import { createPuzzle } from "./puzzle.js";

const BUILDERS = {
  explorer: createExplorer,
  stepper: createStepper,
  puzzle: createPuzzle,
};

export function mountWidgets(root = document) {
  const mounted = [];
  for (const host of root.querySelectorAll("[data-widget]")) {
    if (host.dataset.mounted === "true") continue;
    const kind = host.dataset.widget;
    const build = BUILDERS[kind];
    if (!build) {
      console.warn("Unknown widget:", kind, host);
      continue;
    }

    const lesson = findLesson(host.dataset.lesson);
    if (host.dataset.lesson && !lesson) {
      host.textContent = `Lesson "${host.dataset.lesson}" is missing.`;
      continue;
    }

    // Attributes on the element win over the lesson file, so a page can
    // reuse a position with its own caption.
    const config = {
      ...(lesson || {}),
      ...(host.dataset.fen ? { fen: host.dataset.fen } : {}),
      ...(host.dataset.line ? { line: host.dataset.line } : {}),
      ...(host.dataset.title ? { title: host.dataset.title } : {}),
      ...(host.dataset.prompt ? { prompt: host.dataset.prompt } : {}),
      ...(host.dataset.legend ? { legend: host.dataset.legend } : {}),
      ...(host.dataset.flipped ? { flipped: host.dataset.flipped === "true" } : {}),
      ...(host.dataset.squares ? { squares: host.dataset.squares === "true" } : {}),
    };
    if (host.dataset.title === "") config.title = null;

    try {
      mounted.push(build(host, config));
      host.dataset.mounted = "true";
    } catch (err) {
      console.error("Could not build widget", host.dataset, err);
      host.textContent = "This board could not be loaded.";
    }
  }
  return mounted;
}
