// ============================================================
// stepper: walk a line of moves forwards and backwards, with a
// sentence explaining each one. Used for openings, checkmate
// patterns, special rules and endgames.
// ============================================================

import { playLine, START_FEN } from "../core/chess.js";
import { BoardView } from "../core/board-view.js";
import { buildFrame, button, el } from "./frame.js";

export function createStepper(host, config = {}) {
  const steps = playLine(config.fen || START_FEN, config.line || "");
  const notes = config.notes || [];

  const { boardEl, statusEl, controlsEl, listEl, side } = buildFrame(host, {
    title: config.title,
    moveList: config.moveList !== false && steps.length > 1,
  });

  const counter = el("p", "board-legend");
  side.insertBefore(counter, controlsEl);

  const view = new BoardView(boardEl, {
    flipped: !!config.flipped,
    interactive: false,
    label: (config.title || "Chess") + " walkthrough",
  });

  let ply = 0;
  let timer = null;

  // Move list: "1. e4 e5  2. Nf3 Nc6 …", every move clickable.
  const items = [];
  if (listEl) {
    const firstTurn = steps[0].position.turn;
    let moveNo = steps[0].position.fullmove;
    if (firstTurn === "b") {
      listEl.appendChild(el("li", "num", moveNo + "..."));
    }
    steps.slice(1).forEach((step, i) => {
      const turn = steps[i].position.turn;
      if (turn === "w") {
        listEl.appendChild(el("li", "num", moveNo + "."));
      }
      const li = el("li", "san-item", step.san);
      li.tabIndex = 0;
      li.addEventListener("click", () => goTo(i + 1));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTo(i + 1); }
      });
      listEl.appendChild(li);
      items.push(li);
      if (turn === "b") moveNo++;
    });
  }

  function noteFor(index) {
    if (notes[index]) return notes[index];
    if (index === 0) return config.intro || "Press Next to play through the moves.";
    const step = steps[index];
    return `${step.san}` + (index === steps.length - 1 && config.outro ? `. ${config.outro}` : "");
  }

  function goTo(target, animate = true) {
    const previous = ply;
    ply = Math.max(0, Math.min(steps.length - 1, target));
    const step = steps[ply];
    const slide = animate && ply === previous + 1 && step.move;
    view.setPosition(step.position, slide ? { from: step.move.from, to: step.move.to } : {});
    view.clearMarks();
    if (step.move) view.markLastMove(step.move.from, step.move.to);
    view.markCheck();

    statusEl.textContent = noteFor(ply);
    counter.textContent =
      ply === 0
        ? `Starting position · ${steps.length - 1} move${steps.length === 2 ? "" : "s"} to see`
        : `Move ${ply} of ${steps.length - 1}${step.san ? " · " + step.san : ""}`;

    items.forEach((li, i) => li.classList.toggle("current", i === ply - 1));
    if (items[ply - 1]) {
      items[ply - 1].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    backBtn.disabled = ply === 0;
    nextBtn.disabled = ply === steps.length - 1;
    if (ply === steps.length - 1) stopPlaying();
  }

  function stopPlaying() {
    if (timer) clearInterval(timer);
    timer = null;
    playBtn.textContent = "Play";
    playBtn.classList.remove("primary");
  }

  const backBtn = button("◀ Back", "", () => { stopPlaying(); goTo(ply - 1, false); });
  const nextBtn = button("Next ▶", "primary", () => { stopPlaying(); goTo(ply + 1); });
  const playBtn = button("Play", "", () => {
    if (timer) return stopPlaying();
    if (ply === steps.length - 1) goTo(0, false);
    playBtn.textContent = "Pause";
    playBtn.classList.add("primary");
    timer = setInterval(() => goTo(ply + 1), 1300);
  });
  const resetBtn = button("Start over", "", () => { stopPlaying(); goTo(0, false); });
  const flipBtn = button("Flip", "", () => {
    view.setFlipped(!view.flipped);
    goTo(ply, false);
  });

  controlsEl.append(backBtn, nextBtn, playBtn, resetBtn, flipBtn);

  goTo(0, false);
  return { goTo, view };
}
