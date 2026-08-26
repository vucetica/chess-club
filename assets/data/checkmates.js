// The checkmate patterns every club player should be able to
// deliver in their sleep.

export const checkmates = {
  "back-rank": {
    title: "Back-rank mate",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    line: "Ra8#",
    notes: [
      "Black's king is safe behind three pawns... or is it? Those pawns are also a wall the king cannot climb over.",
      "Ra8#: Checkmate in one move. The rook covers the whole back rank, and the king's own pawns block f7, g7 and h7.",
    ],
    outro: "Give your king an escape square (h6 or h3) early, and this can never happen to you.",
  },

  "ladder-mate": {
    title: "The ladder (two rooks)",
    fen: "8/8/8/4k3/8/8/R7/1R6 w - - 0 1",
    line: "Ra5+ Ke6 Rb6+ Ke7 Ra7+ Ke8 Rb8#",
    notes: [
      "Two rooks and nothing else. They work like a ladder: one rook checks, the other builds the next rung.",
      "1. Ra5+: The rook takes the whole 5th rank away. The king must climb up a step.",
      "1... Ke6",
      "2. Rb6+: Now the other rook takes the 6th rank. Notice how each rook stays far away from the king so it can never be captured.",
      "2... Ke7",
      "3. Ra7+: The 7th rank goes too. The king is running out of board.",
      "3... Ke8",
      "4. Rb8#: Checkmate. One rook covers the 8th rank, the other covers the 7th, and the king has nowhere left to stand.",
    ],
  },

  "queen-mate": {
    title: "King and queen against a lone king",
    fen: "8/8/8/4k3/8/8/8/3QK3 w - - 0 1",
    line: "Kf2 Kf5 Qe2 Kg5 Qf3 Kh4 Qg3+ Kh5 Qg7 Kh4 Qg6 Kh3 Qh5#",
    notes: [
      "You will win a queen one day and need to finish the game. Here is the safe way: shrink the box, then bring the king.",
      "1. Kf2: The king starts walking. A queen alone can never mate; she always needs the king's help.",
      "1... Kf5",
      "2. Qe2: The queen builds a wall. Every square behind that wall is off limits to the black king.",
      "2... Kg5",
      "3. Qf3: The box gets smaller. The black king now only has the top-right corner of the board.",
      "3... Kh4",
      "4. Qg3+: Squeeze.",
      "4... Kh5",
      "5. Qg7: Watch the queen keep a knight's-move away from the king. That is the trick that avoids stalemate.",
      "5... Kh4",
      "6. Qg6: Smaller still.",
      "6... Kh3",
      "7. Qh5#: Checkmate. The white king on f2 covers g2 and g3, and the queen does the rest.",
    ],
    outro: "Careful: if the lone king ever has no legal move and is NOT in check, that is stalemate and the game is a draw.",
  },

  "rook-mate": {
    title: "King and rook against a lone king",
    fen: "8/4k3/8/4K3/8/8/8/R7 w - - 0 1",
    line: "Ra7+ Ke8 Ke6 Kf8 Kf6 Kg8 Kg6 Kh8 Ra8#",
    notes: [
      "Harder than the queen, but the same idea: the rook cuts, the king pushes.",
      "1. Ra7+: The rook takes the 7th rank. The black king can never come back down.",
      "1... Ke8",
      "2. Ke6: This is the opposition: the two kings face each other with one square between them. The black king has to give way.",
      "2... Kf8: Black runs sideways.",
      "3. Kf6: White follows. Always keep the kings facing.",
      "3... Kg8",
      "4. Kg6: Following again.",
      "4... Kh8: The corner. There is nowhere else.",
      "5. Ra8#: Checkmate. The rook checks along the 8th rank and the white king covers g7, g8 and h7.",
    ],
  },

  scholars: {
    title: "Scholar's Mate: don't fall for this!",
    line: "e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#",
    notes: [
      "Someone in your club will try this on you. Learn it, then learn to stop it.",
      "1. e4",
      "1... e5",
      "2. Bc4: The bishop aims at f7. Remember: f7 is defended only by the king.",
      "2... Nc6: A perfectly normal developing move.",
      "3. Qh5: Now the queen aims at f7 too. Two attackers, one defender.",
      "3... Nf6?? This looks natural, but it ignores the threat.",
      "4. Qxf7#: Checkmate. The queen is protected by the bishop on c4, so the king cannot capture her.",
    ],
  },

  "scholars-defence": {
    title: "How to stop Scholar's Mate",
    line: "e4 e5 Bc4 Nc6 Qh5 g6 Qf3 Nf6 Qb3 Nd4",
    notes: [
      "Same trap, but Black knows what is coming. Two defences work: g6 or Qe7. Here is g6.",
      "1. e4",
      "1... e5",
      "2. Bc4",
      "2... Nc6",
      "3. Qh5: The threat is Qxf7#.",
      "3... g6! The pawn attacks the queen AND blocks her path to f7. One move, two jobs.",
      "4. Qf3: Still trying for f7.",
      "4... Nf6: Now a knight guards the square as well. The attack is over.",
      "5. Qb3: The queen has moved three times and White still has one piece developed.",
      "5... Nd4! Black attacks the queen again and is already much better. Punish an early queen by developing with threats.",
    ],
  },

  smothered: {
    title: "Smothered mate",
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    line: "Nf7#",
    notes: [
      "The prettiest mate in chess. The king is trapped by its own army.",
      "Nf7#: Checkmate by a single knight. The king cannot take it, cannot move to g8 (its own rook is there) and cannot move to g7 or h7 (its own pawns). Only a knight can do this, because only a knight can check from a square the king cannot reach.",
    ],
  },

  epaulette: {
    title: "Epaulette mate",
    fen: "3rkr2/8/8/8/8/7Q/8/6K1 w - - 0 1",
    line: "Qe6#",
    notes: [
      "Named after the shoulder pads on an old army uniform: the two rooks sit on the king's shoulders and block his escape.",
      "Qe6#: Checkmate. The queen checks up the e-file and covers d7 and f7. The king's own rooks take away d8 and f8. Crowded pieces can be as dangerous as no pieces.",
    ],
  },

  philidor: {
    title: "Philidor's Legacy: the full smothered mate",
    fen: "5r1k/6pp/8/6N1/8/1Q6/8/6K1 w - - 0 1",
    line: "Nf7+ Kg8 Nh6+ Kh8 Qg8+ Rxg8 Nf7#",
    notes: [
      "A famous combination in chess, first written down over 400 years ago. White gives away the queen on purpose.",
      "1. Nf7+: Check. (Black cannot answer with Rxf7, because the queen on b3 would take the rook and mate follows.)",
      "1... Kg8",
      "2. Nh6+: Double check! Both the knight and the queen are checking, so only the king may move.",
      "2... Kh8: Kf8 loses instantly to Qf7#, so the king goes back.",
      "3. Qg8+!! The queen jumps in front of the enemy rook. She cannot be taken by the king, because the knight on h6 guards g8.",
      "3... Rxg8: Forced. And now Black's own rook has blocked the king's last escape square.",
      "4. Nf7#: Smothered mate. Learn this pattern and you will spot it in your own games one day.",
    ],
  },
};
