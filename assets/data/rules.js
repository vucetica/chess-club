// The three special moves plus the ways a game can end.

export const rules = {
  "castle-kingside": {
    title: "Castling kingside (short castling)",
    fen: "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    line: "O-O O-O",
    notes: [
      "Both players have cleared the squares between king and rook. Time to castle.",
      "1. O-O: The king slides TWO squares toward the rook, and the rook hops over to the other side. It counts as one move, and it is the only time two pieces move at once.",
      "1... O-O: Black does the same. Both kings are tucked behind three pawns and both rooks are suddenly useful. Try to castle in the first ten moves of every game.",
    ],
  },

  "castle-queenside": {
    title: "Castling queenside (long castling)",
    fen: "r3kbnr/pppq1ppp/2npb3/4p3/4P3/2NPBN2/PPPQ1PPP/R3KB1R w KQkq - 6 6",
    line: "O-O-O O-O-O",
    notes: [
      "Queenside castling needs THREE empty squares (b1, c1 and d1) instead of two.",
      "1. O-O-O: The king travels two squares to c1 and the rook jumps all the way to d1. Written with three O's.",
      "1... O-O-O: Black castles long too. The king is a little closer to the edge here, so many players later play Kb1 to tuck it away completely.",
    ],
  },

  "en-passant": {
    title: "En passant: captured while passing by",
    fen: "4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1",
    line: "d5 exd6",
    notes: [
      "White's pawn is on e5. Black's d-pawn is about to run past it.",
      "1... d5: Black uses the two-square first move, hoping to sneak past the white pawn.",
      "2. exd6: En passant! French for 'in passing'. The white pawn captures as if the black pawn had only moved one square. You may only do this as the very next move, otherwise the chance is gone.",
    ],
    outro: "Only pawns can capture en passant, and only against a pawn that has just made its two-square jump.",
  },

  promotion: {
    title: "Promotion: a pawn's dream",
    fen: "8/3P2k1/8/8/8/8/6K1/8 w - - 0 1",
    line: "d8=Q",
    notes: [
      "This pawn has walked six squares to get here. One more step and it can transform into another piece.",
      "d8=Q: The pawn reaches the last rank and becomes a queen. You may choose a rook, bishop or knight instead, and you may have two queens (or nine!) on the board at once. Almost always, choose the queen.",
    ],
    outro: "Choosing something other than a queen is called underpromotion. The usual reason is a knight that gives check or an escape from stalemate.",
  },

  stalemate: {
    title: "Stalemate: how to throw away a win",
    fen: "7k/8/6K1/3Q4/8/8/8/8 w - - 0 1",
    line: "Qf7",
    notes: [
      "White is winning easily. There is a checkmate available in one move. Watch what happens instead.",
      "Qf7?? Stalemate. Black is NOT in check, but has no legal move at all: g8, g7 and h7 are all covered. The game is an instant draw, and half a point disappears. Whenever your opponent is down to a lone king, check that they still have a move.",
    ],
  },

  "stalemate-fixed": {
    title: "The move that wins instead",
    fen: "7k/8/6K1/3Q4/8/8/8/8 w - - 0 1",
    line: "Qd8#",
    notes: [
      "Same position, one better move.",
      "Qd8#: Checkmate. The queen checks along the back rank while the king on g6 covers g7 and h7. Look for check first, and stalemate will never surprise you.",
    ],
  },
};
