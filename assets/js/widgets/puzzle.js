// ============================================================
// puzzle: the player has to find the move. Right answers move
// the story on, wrong ones shake the board and offer a hint.
// ============================================================

import { Position, squareName, colorOf, moveToSan, parseSan } from "../core/chess.js";
import { BoardView, describePiece } from "../core/board-view.js";
import { buildFrame, button, el } from "./frame.js";
import { isSolved, markSolved } from "../progress.js";

export function createPuzzle(host, config = {}) {
  // A puzzle can have more than one right answer, so we hold every line
  // and narrow the list as moves are played. `lines` is always the set
  // still consistent with what has happened on the board.
  const allLines = (config.solutions || [config.solution || ""])
    .map((line) => String(line).trim().split(/\s+/).filter(Boolean))
    .filter((tokens) => tokens.length);
  let lines = allLines.slice();
  const start = Position.fromFen(config.fen);
  const heroColor = start.turn;

  const { boardEl, statusEl, controlsEl } = buildFrame(host, {
    title: config.title,
    legend: config.goal || (heroColor === "w" ? "White to move." : "Black to move."),
    legendFirst: true,
  });

  const view = new BoardView(boardEl, {
    flipped: heroColor === "b",
    label: config.title || "Puzzle board",
  });

  // A "Solved" badge in the caption, driven by what is actually stored,
  // so it survives a page reload and a Reset, and clears when the player
  // wipes their progress.
  const badge = el("span", "solved-badge", "Solved");
  const caption = host.querySelector("figcaption");
  if (caption) caption.appendChild(badge);

  function refreshSolvedMark() {
    const done = !!(config.id && isSolved(config.id));
    host.classList.toggle("is-solved", done);
    badge.hidden = !done;
  }
  document.addEventListener("puzzle-solved", refreshSolvedMark);

  let position = start;
  let index = 0;          // how many moves of the line have been played
  let selected = null;
  let legal = [];
  let wrongTries = 0;
  let finished = false;

  // Compare by the move a token resolves to, not by its text, so "Nd5+",
  // "Nd5" and coordinate notation all match the same move.
  function tokenMatches(token, move) {
    const parsed = token ? parseSan(position, token) : null;
    return (
      !!parsed &&
      parsed.from === move.from &&
      parsed.to === move.to &&
      (parsed.promotion || null) === (move.promotion || null)
    );
  }

  function say(text, tone) {
    statusEl.textContent = text;
    statusEl.className = "board-status" + (tone ? " " + tone : "");
  }

  function prompt() {
    return heroColor === "w" ? "White to play. Find the move!" : "Black to play. Find the move!";
  }

  function refresh(animation) {
    view.setPosition(position, animation || {});
    view.clearMarks("is-selected", "is-move", "is-capture");
    view.markCheck();
  }

  function finish() {
    finished = true;
    view.clearMarks("is-selected", "is-move", "is-capture", "is-hint");
    const extra = allLines.length - 1;
    say(
      (config.success || "Solved! Nicely spotted.") +
        (extra > 0
          ? ` There ${extra === 1 ? "was a second way" : `were ${extra} other ways`} to solve it.`
          : ""),
      "good"
    );
    hintBtn.disabled = true;
    solveBtn.disabled = true;
    if (config.id) markSolved(config.id);
    refreshSolvedMark();
  }

  // Play the opponent's scripted reply a beat later, so the player sees
  // their own move land first. Different lines can answer differently, so
  // we play the first surviving line's reply and drop the lines that
  // disagree with it.
  function opponentReply() {
    const token = lines[0] && lines[0][index];
    if (!token) return finish();
    const move = parseSan(position, token);
    if (!move) return finish();
    setTimeout(() => {
      const from = move.from;
      lines = lines.filter((line) => tokenMatches(line[index], move));
      position = position.makeMove(move);
      index++;
      refresh({ from, to: move.to });
      view.markLastMove(from, move.to);
      view.markCheck();
      if (lines.some((line) => line.length <= index)) finish();
      else say(config.followUp || "Good. Now find the next move.");
    }, 550);
  }

  function playHeroMove(move) {
    const after = position.makeMove(move);

    // Every line that still expects this move stays in play. A move that
    // ends the game in mate is accepted whatever the lines say, because
    // there is no arguing with mate.
    const surviving = lines.filter((line) => tokenMatches(line[index], move));
    const correct = surviving.length > 0 || after.isCheckmate();

    if (!correct) {
      wrongTries++;
      view.mark(move.to, "is-bad");
      view.shake();
      setTimeout(() => view.clearMarks("is-bad"), 700);
      view.clearMarks("is-selected", "is-move", "is-capture");
      selected = null;
      legal = [];
      say(
        wrongTries >= 2 && config.hint
          ? `Not this time. Hint: ${config.hint}`
          : "Not quite. Look again: what is the very best move here?",
        "bad"
      );
      if (wrongTries >= 2 && config.hint) hintBtn.disabled = true;
      return;
    }

    const from = move.from;
    const san = moveToSan(position, move);
    if (surviving.length) lines = surviving;
    position = after;
    index++;
    selected = null;
    legal = [];
    refresh({ from, to: move.to });
    view.markLastMove(from, move.to);
    view.markCheck();

    if (position.isCheckmate()) return finish();
    if (!lines.length || lines.some((line) => line.length <= index)) return finish();
    say(`${san} is correct!`, "good");
    opponentReply();
  }

  view.onSquareClick((sq) => {
    if (finished) return;
    if (selected !== null) {
      const move = legal.find((m) => m.to === sq && (!m.promotion || m.promotion === "q"));
      if (move) return playHeroMove(move);
    }
    const piece = position.board[sq];
    if (piece && colorOf(piece) === position.turn) {
      selected = sq;
      legal = position.moves({ from: sq });
      view.clearMarks("is-selected", "is-move", "is-capture");
      view.mark(sq, "is-selected");
      const seen = new Set();
      for (const mv of legal) {
        if (seen.has(mv.to)) continue;
        seen.add(mv.to);
        view.mark(mv.to, mv.captured ? "is-capture" : "is-move");
      }
      say(`${describePiece(piece)} on ${squareName(sq)}. Where should it go?`);
    } else {
      selected = null;
      legal = [];
      view.clearMarks("is-selected", "is-move", "is-capture");
      say(prompt());
    }
  });

  const hintBtn = button("Hint", "", () => {
    const move = lines[0] ? parseSan(position, lines[0][index]) : null;
    if (config.hint) say(`Hint: ${config.hint}`);
    if (move) {
      view.clearMarks("is-hint");
      view.mark(move.from, "is-hint");
      if (!config.hint) {
        say(`Hint: move the ${describePiece(position.board[move.from])} on ${squareName(move.from)}.`);
      }
      setTimeout(() => view.clearMarks("is-hint"), 2600);
    }
    hintBtn.disabled = true;
  });

  const solveBtn = button("Show answer", "", () => {
    const shown = lines[0] || [];
    const remaining = shown.slice(index);
    let delay = 0;
    for (const token of remaining) {
      setTimeout(() => {
        const move = parseSan(position, token);
        if (!move) return;
        const from = move.from;
        position = position.makeMove(move);
        index++;
        refresh({ from, to: move.to });
        view.markLastMove(from, move.to);
        view.markCheck();
      }, delay);
      delay += 700;
    }
    setTimeout(() => {
      finished = true;
      const others = allLines.length - 1;
      say(
        `The answer is ${shown.join(" ")}.` +
          (others > 0
            ? ` There ${others === 1 ? "was another way" : `were ${others} other ways`} to do it too.`
            : "") +
          " Try the next one!"
      );
      hintBtn.disabled = true;
      solveBtn.disabled = true;
    }, delay);
  });

  const resetBtn = button("Reset", "", () => {
    position = start;
    index = 0;
    lines = allLines.slice();
    selected = null;
    legal = [];
    wrongTries = 0;
    finished = false;
    hintBtn.disabled = false;
    solveBtn.disabled = false;
    view.clearMarks();
    refresh();
    say(prompt());
  });

  controlsEl.append(hintBtn, solveBtn, resetBtn);

  refresh();
  refreshSolvedMark();
  say(config.id && isSolved(config.id) ? "You solved this one before. Try it again!" : prompt());

  return { view, reset: () => resetBtn.click() };
}
