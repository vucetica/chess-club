// Tactics puzzles.
//
// `solutions` is a list because a position can have more than one right
// answer, and a puzzle that rejects a good move teaches the wrong thing.
// Each entry is one complete line: the player's moves with the opponent's
// replies in between.
//
// tests.html checks all of it. Every listed line has to be legal and has
// to deliver what the level promises. For the mate puzzles it also works
// out every forced mate in the position and fails if one of them is not
// listed here, so this file cannot fall behind the board again.

export const puzzles = [
  // ---------- Mate in one ----------
  {
    id: "m1-01",
    level: "mate1",
    title: "Puzzle 1: the corridor",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solutions: ["Ra8#"],
    goal: "White to move. Checkmate in one.",
    hint: "The black king's own pawns are in the way. Which rank can it never leave?",
  },
  {
    id: "m1-02",
    level: "mate1",
    title: "Puzzle 2: the queen finishes",
    fen: "7k/8/6K1/3Q4/8/8/8/8 w - - 0 1",
    solutions: ["Qd8#", "Qa8#"],
    goal: "White to move. Checkmate in one.",
    hint: "Your king already guards g7 and h7. Give check along the back rank.",
  },
  {
    id: "m1-03",
    level: "mate1",
    title: "Puzzle 3: too many friends",
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    solutions: ["Nf7#"],
    goal: "White to move. Checkmate in one.",
    hint: "Count the king's escape squares. Every one of them is taken by a black piece.",
  },
  {
    id: "m1-04",
    level: "mate1",
    title: "Puzzle 4: the weakest square",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
    solutions: ["Qxf7#"],
    goal: "White to move. Checkmate in one.",
    hint: "Two of your pieces are staring at the same square, and only the king defends it.",
  },
  {
    id: "m1-05",
    level: "mate1",
    title: "Puzzle 5: the last rung",
    fen: "7k/1R6/8/8/8/8/R7/6K1 w - - 0 1",
    solutions: ["Ra8#"],
    goal: "White to move. Checkmate in one.",
    hint: "One rook already owns the 7th rank. Bring the other one to the 8th.",
  },
  {
    id: "m1-06",
    level: "mate1",
    title: "Puzzle 6: shoulder pads",
    fen: "3rkr2/8/8/8/8/7Q/8/6K1 w - - 0 1",
    solutions: ["Qe6#"],
    goal: "White to move. Checkmate in one.",
    hint: "The king cannot go sideways, because its own rooks are there. Come closer, not further away.",
  },

  // ---------- Win material ----------
  {
    id: "w-01",
    level: "material",
    title: "Puzzle 7: two at once",
    fen: "r3k2r/ppp2ppp/8/3N4/8/8/PPP2PPP/R3K2R w KQkq - 0 1",
    solutions: ["Nxc7+ Ke7 Nxa8"],
    goal: "White to move. Win a rook.",
    hint: "Find a knight jump that checks the king and attacks a rook at the same time.",
    success: "A knight fork! The check forced the king to move, and the rook was left behind.",
  },
  {
    id: "w-02",
    level: "material",
    title: "Puzzle 8: line them up",
    fen: "7q/8/8/4k3/8/8/8/2B1K3 w - - 0 1",
    solutions: ["Bb2+ Kd6 Bxh8"],
    goal: "White to move. Win the queen.",
    hint: "The king and the queen already share a diagonal. Give check on it.",
    success: "A skewer! The king had to move, and the queen behind it was lost.",
  },
  {
    id: "w-03",
    level: "material",
    title: "Puzzle 9: step aside",
    fen: "4k3/8/1q6/8/8/4N3/8/4R2K w - - 0 1",
    solutions: ["Nd5+ Kd7 Nxb6+", "Nc4+ Kd7 Nxb6+"],
    goal: "White to move. Win the queen.",
    hint: "Your rook is aiming at the king, but the knight is in the way. Move the knight somewhere useful.",
    success: "A discovered attack: the rook gave check and the knight attacked the queen. Black could only stop one of them.",
  },
  {
    id: "w-04",
    level: "material",
    title: "Puzzle 10: frozen solid",
    fen: "4k3/8/4n3/8/2B5/8/8/4R1K1 w - - 0 1",
    solutions: ["Bxe6", "Rxe6+"],
    goal: "White to move. Win a piece.",
    hint: "Ask the black knight to move. It cannot, so simply take it.",
    success: "The knight was pinned against its own king, so it could not run and it could not be defended.",
  },
  {
    id: "w-05",
    level: "material",
    title: "Puzzle 11: check, then collect",
    fen: "4k3/8/n7/8/8/8/8/3QK3 w - - 0 1",
    solutions: ["Qe2+ Kf8 Qxa6", "Qa4+ Kf8 Qxa6"],
    goal: "White to move. Win the knight.",
    hint: "Is there a square where your queen gives check AND looks at the knight?",
    success: "A double attack. The check comes first, so Black never gets time to save the knight.",
  },

  // ---------- Mate in two ----------
  {
    id: "m2-01",
    level: "mate2",
    title: "Puzzle 12: build the ladder",
    fen: "4k3/8/8/8/8/8/R7/1R5K w - - 0 1",
    solutions: ["Ra7 Kf8 Rb8#", "Rb7 Kf8 Ra8#"],
    goal: "White to move. Checkmate in two.",
    hint: "Take away the 7th rank first. Then the 8th rank has nowhere to run to.",
    success: "The ladder! One rook takes a rank, the other delivers mate.",
  },
  {
    id: "m2-02",
    level: "mate2",
    title: "Puzzle 13: the quiet move",
    fen: "k2K4/8/8/3R4/8/8/8/8 w - - 0 1",
    solutions: ["Kc7 Ka7 Ra5#"],
    goal: "White to move. Checkmate in two.",
    hint: "There is no check that works. Take the black king's escape squares away with your own king first.",
    success: "The strongest move was not a check at all. The king took b7 and b8 away, and the rook finished the job.",
  },
  {
    id: "m2-03",
    level: "mate2",
    title: "Puzzle 14: the famous sacrifice",
    fen: "5r1k/6pp/7N/8/8/1Q6/8/6K1 w - - 0 1",
    solutions: ["Qg8+ Rxg8 Nf7#"],
    goal: "White to move. Checkmate in two.",
    hint: "Your knight guards g8. What if the queen went there?",
    success: "Smothered mate! The queen sacrificed herself so Black's own rook would block the king's last escape square.",
  },
  {
    id: "m2-04",
    level: "mate2",
    title: "Puzzle 15: a new queen",
    fen: "7k/5P2/5K2/8/8/8/8/8 w - - 0 1",
    solutions: ["f8=Q+ Kh7 Qg7#"],
    goal: "White to move. Checkmate in two.",
    hint: "Promote with check, then use your king as the second attacker.",
    success: "Promote, force the king to the edge, and finish with the queen protected by the king.",
  },
];

export const puzzleGroups = [
  { level: "mate1", title: "Checkmate in one", blurb: "Find the single move that ends the game." },
  { level: "material", title: "Win material", blurb: "Nobody gets mated here. Just win a piece and win the game later." },
  { level: "mate2", title: "Checkmate in two", blurb: "Your move, their answer, and then mate. Think two moves ahead." },
];
