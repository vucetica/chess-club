// ============================================================
// board-view.js: draws a Position into the page.
//
// Knows nothing about chess rules. It shows squares, pieces and
// highlights, and reports clicks. The widgets decide what any of
// it means.
// ============================================================

import { squareName, squareIndex, colorOf, typeOf, fileOf, rankOf } from "./chess.js";

// Solid glyphs for BOTH colours, tinted with CSS.
// Using the outlined characters for White is the classic trap: on
// several systems they come from a different font (or an emoji font)
// and the two armies stop looking like they belong on one board.
const GLYPH = {
  k: "♚︎",
  q: "♛︎",
  r: "♜︎",
  b: "♝︎",
  n: "♞︎",
  p: "♟︎",
};

const NAMES = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};

export function pieceGlyph(piece) {
  return GLYPH[typeOf(piece)] || "";
}

export function describePiece(piece) {
  if (!piece) return "empty";
  return (colorOf(piece) === "w" ? "white " : "black ") + NAMES[typeOf(piece)];
}

export class BoardView {
  constructor(container, options = {}) {
    this.el = container;
    this.flipped = !!options.flipped;
    this.interactive = options.interactive !== false;
    this.showCoordinates = options.coordinates !== false;
    this.position = null;
    this.listeners = [];
    this.focusSquare = this.flipped ? 63 : 0;

    this.el.classList.add("board");
    this.el.setAttribute("role", "grid");
    this.el.setAttribute("aria-label", options.label || "Chess board");

    this.squares = [];
    for (let i = 0; i < 64; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sq";
      btn.dataset.square = String(i);
      btn.setAttribute("role", "gridcell");
      btn.tabIndex = -1;
      const piece = document.createElement("span");
      piece.className = "pc";
      btn.appendChild(piece);
      this.squares[i] = btn;
    }

    this.el.addEventListener("click", (e) => {
      const btn = e.target.closest(".sq");
      if (!btn) return;
      const sq = Number(btn.dataset.square);
      this.focusSquare = sq;
      this.updateTabStops();
      for (const fn of this.listeners) fn(sq, squareName(sq));
    });

    this.el.addEventListener("keydown", (e) => this.handleKey(e));

    this.render();
  }

  onSquareClick(fn) {
    this.listeners.push(fn);
  }

  // Arrow keys walk the board; only one square is ever a tab stop,
  // so a keyboard user does not have to press Tab 64 times.
  handleKey(e) {
    const deltas = {
      ArrowUp: [0, -1], ArrowDown: [0, 1],
      ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    };
    const d = deltas[e.key];
    if (!d) return;
    e.preventDefault();
    const sign = this.flipped ? -1 : 1;
    let f = fileOf(this.focusSquare) + d[0] * sign;
    let r = rankOf(this.focusSquare) + d[1] * sign;
    f = Math.max(0, Math.min(7, f));
    r = Math.max(0, Math.min(7, r));
    this.focusSquare = r * 8 + f;
    this.updateTabStops();
    this.squares[this.focusSquare].focus();
  }

  updateTabStops() {
    for (let i = 0; i < 64; i++) {
      this.squares[i].tabIndex = i === this.focusSquare ? 0 : -1;
    }
  }

  setFlipped(flipped) {
    this.flipped = flipped;
    this.render();
  }

  // Lay the buttons out in view order (flipping just reverses it).
  render() {
    const order = [];
    for (let i = 0; i < 64; i++) order.push(i);
    if (this.flipped) order.reverse();

    this.el.textContent = "";
    for (const sq of order) {
      const btn = this.squares[sq];
      const light = (fileOf(sq) + rankOf(sq)) % 2 === 0;
      btn.classList.toggle("light", light);
      btn.classList.toggle("dark", !light);
      btn.classList.toggle("static", !this.interactive);

      btn.querySelectorAll(".coord").forEach((c) => c.remove());
      if (this.showCoordinates) {
        const bottomRow = this.flipped ? rankOf(sq) === 0 : rankOf(sq) === 7;
        const leftCol = this.flipped ? fileOf(sq) === 7 : fileOf(sq) === 0;
        if (bottomRow) {
          const f = document.createElement("span");
          f.className = "coord coord-file";
          f.textContent = squareName(sq)[0];
          btn.appendChild(f);
        }
        if (leftCol) {
          const r = document.createElement("span");
          r.className = "coord coord-rank";
          r.textContent = squareName(sq)[1];
          btn.appendChild(r);
        }
      }
      this.el.appendChild(btn);
    }
    this.updateTabStops();
    if (this.position) this.paint();
  }

  setPosition(position, options = {}) {
    this.position = position;
    this.paint(options);
  }

  paint(options = {}) {
    const pos = this.position;
    if (!pos) return;
    for (let i = 0; i < 64; i++) {
      const btn = this.squares[i];
      const piece = pos.board[i];
      const span = btn.querySelector(".pc");
      span.textContent = pieceGlyph(piece);
      span.className =
        "pc" + (piece ? " " + (colorOf(piece) === "w" ? "white" : "black") : "");
      btn.setAttribute(
        "aria-label",
        squareName(i) + ", " + describePiece(piece)
      );
    }
    if (options.from !== undefined && options.to !== undefined) {
      this.animate(options.from, options.to);
    }
  }

  // Slide the arriving piece in from where it came. The piece is
  // already in its new home; we offset it and let CSS run it back.
  animate(from, to) {
    if (from === undefined || from === null || from < 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const span = this.squares[to].querySelector(".pc");
    if (!span) return;
    const sign = this.flipped ? -1 : 1;
    const dx = (fileOf(from) - fileOf(to)) * sign;
    const dy = (rankOf(from) - rankOf(to)) * sign;
    span.style.transition = "none";
    span.style.transform = `translate(${dx * 100}%, ${dy * 100}%)`;
    requestAnimationFrame(() => {
      span.style.transition = "";
      span.style.transform = "";
    });
  }

  clearMarks(...kinds) {
    const all = ["is-selected", "is-move", "is-capture", "is-last", "is-check", "is-good", "is-bad", "is-hint"];
    const list = kinds.length ? kinds : all;
    for (const btn of this.squares) btn.classList.remove(...list);
  }

  mark(squares, kind) {
    for (const sq of [].concat(squares)) {
      const i = typeof sq === "string" ? squareIndex(sq) : sq;
      if (i >= 0) this.squares[i].classList.add(kind);
    }
  }

  markLastMove(from, to) {
    this.clearMarks("is-last");
    if (from >= 0) this.squares[from].classList.add("is-last");
    if (to >= 0) this.squares[to].classList.add("is-last");
  }

  markCheck() {
    this.clearMarks("is-check");
    if (!this.position) return;
    if (this.position.isCheck()) {
      const k = this.position.kingSquare(this.position.turn);
      if (k >= 0) this.squares[k].classList.add("is-check");
    }
  }

  shake() {
    this.el.classList.remove("shake");
    void this.el.offsetWidth; // restart the animation
    this.el.classList.add("shake");
  }
}

