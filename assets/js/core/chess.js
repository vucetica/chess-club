// ============================================================
// chess.js: the rules of chess, and nothing more.
//
// No search, no evaluation, no AI. Just enough to answer:
//   "which moves are legal here?" and "is this checkmate?"
// Everything on the site (move highlighting, walkthroughs,
// puzzle checking) is built on these two questions.
//
// Squares are numbered 0-63, a8 = 0, h8 = 7, a1 = 56, h1 = 63.
// Pieces are single letters, uppercase = White: PNBRQK / pnbrqk.
// ============================================================

export const WHITE = "w";
export const BLACK = "b";

export const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const FILES = "abcdefgh";

export function fileOf(sq) {
  return sq & 7;
}
export function rankOf(sq) {
  return sq >> 3; // 0 = the 8th rank (top of the board)
}
export function squareName(sq) {
  return FILES[fileOf(sq)] + (8 - rankOf(sq));
}
export function squareIndex(name) {
  const f = FILES.indexOf(name[0]);
  const r = 8 - Number(name[1]);
  if (f < 0 || r < 0 || r > 7) return -1;
  return r * 8 + f;
}
export function colorOf(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? WHITE : BLACK;
}
export function typeOf(piece) {
  return piece ? piece.toLowerCase() : null;
}

// Move one step from a square. Returns -1 when it walks off the board,
// which is what keeps knights from teleporting around the edges.
function offset(sq, df, dr) {
  const f = fileOf(sq) + df;
  const r = rankOf(sq) + dr;
  if (f < 0 || f > 7 || r < 0 || r > 7) return -1;
  return r * 8 + f;
}

const KNIGHT_STEPS = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const KING_STEPS = BISHOP_DIRS.concat(ROOK_DIRS);

// ============================================================
// Position is immutable: makeMove() hands back a brand new one,
// so a lesson can keep every position in an array and the
// "Back" button is just an index going down by one.
// ============================================================

export class Position {
  constructor(board, turn, castling, ep, halfmove, fullmove) {
    this.board = board;         // 64 entries, null or a piece letter
    this.turn = turn;           // "w" or "b"
    this.castling = castling;   // e.g. "KQkq", or "" for none
    this.ep = ep;               // en-passant target square, or -1
    this.halfmove = halfmove;
    this.fullmove = fullmove;
  }

  static fromFen(fen = START_FEN) {
    const parts = fen.trim().split(/\s+/);
    const board = new Array(64).fill(null);
    let sq = 0;
    for (const ch of parts[0]) {
      if (ch === "/") continue;
      if (ch >= "1" && ch <= "8") sq += Number(ch);
      else board[sq++] = ch;
    }
    return new Position(
      board,
      parts[1] || "w",
      parts[2] && parts[2] !== "-" ? parts[2] : "",
      parts[3] && parts[3] !== "-" ? squareIndex(parts[3]) : -1,
      Number(parts[4] || 0),
      Number(parts[5] || 1)
    );
  }

  toFen() {
    let rows = [];
    for (let r = 0; r < 8; r++) {
      let row = "";
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[r * 8 + f];
        if (p) {
          if (empty) { row += empty; empty = 0; }
          row += p;
        } else empty++;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    return [
      rows.join("/"),
      this.turn,
      this.castling || "-",
      this.ep >= 0 ? squareName(this.ep) : "-",
      this.halfmove,
      this.fullmove,
    ].join(" ");
  }

  pieceAt(sq) {
    return this.board[typeof sq === "string" ? squareIndex(sq) : sq];
  }

  kingSquare(color) {
    const target = color === WHITE ? "K" : "k";
    return this.board.indexOf(target);
  }

  isAttacked(sq, byColor) {
    return isAttacked(this.board, sq, byColor);
  }

  isCheck(color = this.turn) {
    const k = this.kingSquare(color);
    if (k < 0) return false;
    return isAttacked(this.board, k, color === WHITE ? BLACK : WHITE);
  }

  // All legal moves, optionally just the ones leaving a given square.
  moves(options = {}) {
    let from = options.from;
    if (typeof from === "string") from = squareIndex(from);
    const pseudo = generatePseudoMoves(this, this.turn, from);
    const legal = [];
    for (const mv of pseudo) {
      const next = this.makeMove(mv, { skipChecks: true });
      if (!next.isCheck(this.turn)) legal.push(mv);
    }
    return legal;
  }

  isCheckmate() {
    return this.isCheck() && this.moves().length === 0;
  }

  isStalemate() {
    return !this.isCheck() && this.moves().length === 0;
  }

  // Only the plainly-dead material combinations: K vs K, K+B, K+N.
  isInsufficientMaterial() {
    const pieces = this.board.filter(Boolean).map((p) => p.toLowerCase());
    if (pieces.some((p) => p === "p" || p === "r" || p === "q")) return false;
    const minor = pieces.filter((p) => p === "b" || p === "n").length;
    return minor <= 1;
  }

  makeMove(move, options = {}) {
    if (typeof move === "string") {
      const parsed = parseSan(this, move);
      if (!parsed) throw new Error(`Illegal or unreadable move: ${move}`);
      move = parsed;
    }
    const board = this.board.slice();
    const piece = board[move.from];
    const color = colorOf(piece);
    const type = typeOf(piece);

    board[move.from] = null;
    board[move.to] = move.promotion
      ? color === WHITE
        ? move.promotion.toUpperCase()
        : move.promotion.toLowerCase()
      : piece;

    if (move.enPassant) {
      // The captured pawn sits beside the arriving pawn, not under it.
      board[move.to + (color === WHITE ? 8 : -8)] = null;
    }
    if (move.castle) {
      const rank = color === WHITE ? 56 : 0;
      if (move.castle === "k") {
        board[rank + 5] = board[rank + 7];
        board[rank + 7] = null;
      } else {
        board[rank + 3] = board[rank + 0];
        board[rank + 0] = null;
      }
    }

    // Castling rights die when the king or a rook leaves home,
    // or when a rook is captured on its home square.
    let castling = this.castling;
    const drop = (chars) => {
      for (const c of chars) castling = castling.replace(c, "");
    };
    if (type === "k") drop(color === WHITE ? "KQ" : "kq");
    if (move.from === 63 || move.to === 63) drop("K");
    if (move.from === 56 || move.to === 56) drop("Q");
    if (move.from === 7 || move.to === 7) drop("k");
    if (move.from === 0 || move.to === 0) drop("q");

    const ep =
      type === "p" && Math.abs(rankOf(move.to) - rankOf(move.from)) === 2
        ? (move.from + move.to) / 2
        : -1;

    const halfmove =
      type === "p" || move.captured ? 0 : this.halfmove + 1;

    return new Position(
      board,
      color === WHITE ? BLACK : WHITE,
      castling,
      ep,
      halfmove,
      color === BLACK ? this.fullmove + 1 : this.fullmove
    );
  }
}

// ============================================================
// Attack detection is asked once per generated move, so it walks
// out from the square instead of generating every enemy move.
// ============================================================

function isAttacked(board, sq, byColor) {
  const white = byColor === WHITE;

  // Pawns: look back along the diagonals they capture from.
  const pawnDir = white ? 1 : -1; // white pawns attack upward, so they sit below
  for (const df of [-1, 1]) {
    const from = offset(sq, df, pawnDir);
    if (from >= 0 && board[from] === (white ? "P" : "p")) return true;
  }

  for (const [df, dr] of KNIGHT_STEPS) {
    const from = offset(sq, df, dr);
    if (from >= 0 && board[from] === (white ? "N" : "n")) return true;
  }

  for (const [df, dr] of KING_STEPS) {
    const from = offset(sq, df, dr);
    if (from >= 0 && board[from] === (white ? "K" : "k")) return true;
  }

  const slide = (dirs, types) => {
    for (const [df, dr] of dirs) {
      let cur = offset(sq, df, dr);
      while (cur >= 0) {
        const p = board[cur];
        if (p) {
          if (colorOf(p) === byColor && types.includes(typeOf(p))) return true;
          break;
        }
        cur = offset(cur, df, dr);
      }
    }
    return false;
  };

  return (
    slide(BISHOP_DIRS, ["b", "q"]) || slide(ROOK_DIRS, ["r", "q"])
  );
}

// ============================================================
// Pseudo-legal move generation (may leave your own king in check;
// Position.moves() filters those out).
// ============================================================

function addPawnMove(moves, pos, from, to, captured) {
  const lastRank = rankOf(to) === 0 || rankOf(to) === 7;
  if (lastRank) {
    for (const promo of ["q", "r", "b", "n"]) {
      moves.push({ from, to, piece: pos.board[from], captured, promotion: promo });
    }
  } else {
    moves.push({ from, to, piece: pos.board[from], captured });
  }
}

function generatePseudoMoves(pos, color, onlyFrom) {
  const moves = [];
  const board = pos.board;
  const enemy = color === WHITE ? BLACK : WHITE;

  for (let from = 0; from < 64; from++) {
    if (onlyFrom !== undefined && from !== onlyFrom) continue;
    const piece = board[from];
    if (!piece || colorOf(piece) !== color) continue;
    const type = typeOf(piece);

    if (type === "p") {
      const dr = color === WHITE ? -1 : 1;
      const startRank = color === WHITE ? 6 : 1;
      const one = offset(from, 0, dr);
      if (one >= 0 && !board[one]) {
        addPawnMove(moves, pos, from, one, null);
        const two = offset(from, 0, 2 * dr);
        if (rankOf(from) === startRank && two >= 0 && !board[two]) {
          moves.push({ from, to: two, piece, captured: null });
        }
      }
      for (const df of [-1, 1]) {
        const to = offset(from, df, dr);
        if (to < 0) continue;
        if (board[to] && colorOf(board[to]) === enemy) {
          addPawnMove(moves, pos, from, to, board[to]);
        } else if (to === pos.ep) {
          moves.push({
            from, to, piece,
            captured: color === WHITE ? "p" : "P",
            enPassant: true,
          });
        }
      }
      continue;
    }

    if (type === "n" || type === "k") {
      const steps = type === "n" ? KNIGHT_STEPS : KING_STEPS;
      for (const [df, dr] of steps) {
        const to = offset(from, df, dr);
        if (to < 0) continue;
        if (board[to] && colorOf(board[to]) === color) continue;
        moves.push({ from, to, piece, captured: board[to] || null });
      }
      continue;
    }

    const dirs =
      type === "b" ? BISHOP_DIRS : type === "r" ? ROOK_DIRS : KING_STEPS;
    for (const [df, dr] of dirs) {
      let to = offset(from, df, dr);
      while (to >= 0) {
        const target = board[to];
        if (target && colorOf(target) === color) break;
        moves.push({ from, to, piece, captured: target || null });
        if (target) break;
        to = offset(to, df, dr);
      }
    }
  }

  // Castling: the king may not start in check, pass through an
  // attacked square, or land on one, and the path must be empty.
  const kingHome = color === WHITE ? 60 : 4;
  const rights = color === WHITE ? ["K", "Q"] : ["k", "q"];
  if (
    (onlyFrom === undefined || onlyFrom === kingHome) &&
    board[kingHome] === (color === WHITE ? "K" : "k") &&
    !isAttacked(board, kingHome, enemy)
  ) {
    if (pos.castling.includes(rights[0]) && !board[kingHome + 1] && !board[kingHome + 2]) {
      if (!isAttacked(board, kingHome + 1, enemy) && !isAttacked(board, kingHome + 2, enemy)) {
        moves.push({
          from: kingHome, to: kingHome + 2,
          piece: board[kingHome], captured: null, castle: "k",
        });
      }
    }
    if (
      pos.castling.includes(rights[1]) &&
      !board[kingHome - 1] && !board[kingHome - 2] && !board[kingHome - 3]
    ) {
      if (!isAttacked(board, kingHome - 1, enemy) && !isAttacked(board, kingHome - 2, enemy)) {
        moves.push({
          from: kingHome, to: kingHome - 2,
          piece: board[kingHome], captured: null, castle: "q",
        });
      }
    }
  }

  return moves;
}

// ============================================================
// Notation. Lesson content is written the way a scoresheet is
// written ("e4 e5 Nf3 Nc6 Bc4"), so the site has to read it.
// ============================================================

export function moveToSan(pos, move) {
  if (move.castle) {
    var san = move.castle === "k" ? "O-O" : "O-O-O";
  } else {
    const type = typeOf(move.piece);
    var san = "";
    if (type === "p") {
      if (move.captured) san += FILES[fileOf(move.from)] + "x";
      san += squareName(move.to);
      if (move.promotion) san += "=" + move.promotion.toUpperCase();
    } else {
      san = type.toUpperCase();
      // Disambiguate only against pieces that could really go there.
      const rivals = pos
        .moves()
        .filter(
          (m) =>
            m.to === move.to &&
            m.from !== move.from &&
            typeOf(m.piece) === type
        );
      if (rivals.length) {
        const sameFile = rivals.some((m) => fileOf(m.from) === fileOf(move.from));
        const sameRank = rivals.some((m) => rankOf(m.from) === rankOf(move.from));
        if (!sameFile) san += FILES[fileOf(move.from)];
        else if (!sameRank) san += String(8 - rankOf(move.from));
        else san += squareName(move.from);
      }
      if (move.captured) san += "x";
      san += squareName(move.to);
    }
  }
  const after = pos.makeMove(move);
  if (after.isCheckmate()) san += "#";
  else if (after.isCheck()) san += "+";
  return san;
}

export function parseSan(pos, san) {
  const clean = String(san).replace(/[+#!?]+$/, "").replace(/0/g, "O").trim();
  const legal = pos.moves();

  if (clean === "O-O" || clean === "O-O-O") {
    const side = clean === "O-O" ? "k" : "q";
    return legal.find((m) => m.castle === side) || null;
  }

  // Coordinate notation ("e2e4", "e7e8q") is accepted too, which is handy
  // for puzzle answers and for anything the board itself produces.
  const coord = clean.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/i);
  if (coord) {
    const from = squareIndex(coord[1]);
    const to = squareIndex(coord[2]);
    const promo = coord[3] ? coord[3].toLowerCase() : null;
    return (
      legal.find(
        (m) =>
          m.from === from &&
          m.to === to &&
          (promo ? m.promotion === promo : !m.promotion || m.promotion === "q")
      ) || null
    );
  }

  const m = clean.match(
    /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=?([QRBN]))?$/
  );
  if (!m) return null;
  const [, letter, fromFile, fromRank, , dest, promo] = m;
  const type = letter ? letter.toLowerCase() : "p";
  const to = squareIndex(dest);

  const candidates = legal.filter((mv) => {
    if (mv.to !== to) return false;
    if (typeOf(mv.piece) !== type) return false;
    if (fromFile && FILES[fileOf(mv.from)] !== fromFile) return false;
    if (fromRank && String(8 - rankOf(mv.from)) !== fromRank) return false;
    if (promo && mv.promotion !== promo.toLowerCase()) return false;
    if (!promo && mv.promotion && mv.promotion !== "q") return false;
    return true;
  });
  return candidates.length === 1 ? candidates[0] : candidates[0] || null;
}

// Replay a line of moves. Returns one entry per move, each holding the
// move, its notation, and the position it produced, exactly what the
// stepper widget needs to walk forwards and backwards.
export function playLine(startFen, line) {
  const tokens = Array.isArray(line)
    ? line.slice()
    : String(line)
        .replace(/\d+\.(\.\.)?/g, " ")   // drop "1." and "1..."
        .trim()
        .split(/\s+/)
        .filter(Boolean);

  let pos = Position.fromFen(startFen || START_FEN);
  const steps = [{ position: pos, san: null, move: null }];
  for (const token of tokens) {
    const move = parseSan(pos, token);
    if (!move) throw new Error(`Illegal move "${token}" in line: ${line}`);
    const san = moveToSan(pos, move);
    pos = pos.makeMove(move);
    steps.push({ position: pos, san, move });
  }
  return steps;
}

// Node counter used by tests.html to prove move generation is right.
export function perft(pos, depth) {
  if (depth === 0) return 1;
  const moves = pos.moves();
  if (depth === 1) return moves.length;
  let total = 0;
  for (const mv of moves) total += perft(pos.makeMove(mv), depth - 1);
  return total;
}
