// ============================================================
// explorer: click a piece, see everywhere it is allowed to go.
// The workhorse of "How the pieces move".
// ============================================================

import { Position, squareName, fileOf, rankOf, colorOf, typeOf, START_FEN } from "../core/chess.js";
import { BoardView, describePiece } from "../core/board-view.js";
import { buildFrame, button } from "./frame.js";

const PIECE_WORD = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};

export function createExplorer(host, config = {}) {
  const startFen = config.fen || START_FEN;
  const { boardEl, statusEl, controlsEl } = buildFrame(host, {
    title: config.title,
    legend: config.legend || "Green dot = a square it can move to. Red ring = a piece it can capture.",
  });

  const view = new BoardView(boardEl, {
    flipped: !!config.flipped,
    label: config.title || "Practice board",
  });
  let position = Position.fromFen(startFen);
  let selected = null;
  let legal = [];

  // Boards that show a whole game position take turns properly: you may
  // still light up either army, but only the side to move may actually
  // play. The single-piece boards on "How the pieces move" leave this off,
  // because there the point is to push one knight around all afternoon.
  const strictTurns = !!config.turns;
  const sideWord = (color) => (color === "w" ? "White" : "Black");

  const idle = config.prompt || "Click any piece to light up its moves.";

  function refresh(animation) {
    view.setPosition(position, animation);
    view.clearMarks("is-selected", "is-move", "is-capture");
    view.markCheck();
  }

  function say(text, tone) {
    statusEl.textContent = text;
    statusEl.className = "board-status" + (tone ? " " + tone : "");
  }

  function select(sq) {
    const piece = position.board[sq];
    if (!piece) return clearSelection();

    // A learner should be able to poke at either army, whoever's
    // "turn" it technically is, so we ask the question from that
    // side's point of view.
    const probe =
      colorOf(piece) === position.turn
        ? position
        : new Position(
            position.board,
            colorOf(piece),
            position.castling,
            -1,
            position.halfmove,
            position.fullmove
          );

    legal = probe.moves({ from: sq });
    selected = sq;

    view.clearMarks("is-selected", "is-move", "is-capture");
    view.mark(sq, "is-selected");
    const seen = new Set();
    for (const mv of legal) {
      if (seen.has(mv.to)) continue;
      seen.add(mv.to);
      view.mark(mv.to, mv.captured ? "is-capture" : "is-move");
    }

    const word = PIECE_WORD[typeOf(piece)];
    const side = sideWord(colorOf(piece));
    const waiting =
      strictTurns && colorOf(piece) !== position.turn
        ? ` It is ${sideWord(position.turn)}'s turn, so this one has to wait.`
        : "";
    if (!seen.size) {
      say(`The ${side.toLowerCase()} ${word} on ${squareName(sq)} has no legal moves right now.`);
    } else {
      const captures = legal.filter((m) => m.captured).length;
      say(
        `${side} ${word} on ${squareName(sq)}: ${seen.size} square${seen.size === 1 ? "" : "s"} to choose from` +
          (captures ? `, including ${captures} capture${captures === 1 ? "" : "s"}.` : ".") +
          waiting
      );
    }
  }

  function clearSelection(emptySq) {
    selected = null;
    legal = [];
    view.clearMarks("is-selected", "is-move", "is-capture");
    // Boards that teach coordinates answer the click with the name of the
    // square. Everywhere else the prompt is the lesson, so it stays put.
    if (config.squares && emptySq !== undefined) {
      const white = (fileOf(emptySq) + rankOf(emptySq)) % 2 === 0;
      say(`That is ${squareName(emptySq)}, ${white ? "a white" : "a black"} square.`);
    } else {
      say(idle);
    }
  }

  view.onSquareClick((sq) => {
    if (selected !== null) {
      const move = legal.find((m) => m.to === sq && (!m.promotion || m.promotion === "q"));
      if (move) {
        const piece = position.board[move.from];
        if (strictTurns && colorOf(piece) !== position.turn) {
          // The dots stay lit, so the next click can pick the right piece.
          const mover = sideWord(position.turn);
          say(`Not yet: it is ${mover}'s turn. Click a ${mover.toLowerCase()} piece.`, "bad");
          return;
        }
        const from = move.from;
        // Explorer boards always promote to a queen; the promotion
        // menu belongs on the Special Rules page, not here.
        position = position.makeMove(move);
        refresh({ from, to: move.to });
        view.markLastMove(from, move.to);
        selected = null;
        legal = [];
        const captured = move.captured ? ` and takes the ${describePiece(move.captured)}` : "";
        say(
          `${describePiece(piece)} ${squareName(from)} → ${squareName(move.to)}${captured}.`
        );
        resetBtn.disabled = false;
        return;
      }
    }
    if (position.board[sq]) select(sq);
    else clearSelection(sq);
  });

  const resetBtn = button("Start over", "", () => {
    position = Position.fromFen(startFen);
    refresh();
    view.clearMarks();
    clearSelection();
    resetBtn.disabled = true;
  });
  resetBtn.disabled = true;

  const flipBtn = button("Flip board", "", () => {
    view.setFlipped(!view.flipped);
    refresh();
  });

  controlsEl.append(resetBtn, flipBtn);
  refresh();
  clearSelection();

  return { view, reset: () => resetBtn.click() };
}
