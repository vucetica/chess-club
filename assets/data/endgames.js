// Endgames: fewer pieces, and every one of them matters.

export const endgames = {
  opposition: {
    title: "The opposition",
    fen: "4k3/8/4K3/4P3/8/8/8/8 b - - 0 1",
    line: "Kf8 Kd7 Kf7 e6+ Kf8 e7+ Kf7 e8=Q+",
    notes: [
      "One pawn, two kings. Whoever wins the staring contest wins the game. The kings face each other with one square between them, and it is Black to move, so Black has to give way.",
      "1... Kf8: Forced to step aside.",
      "2. Kd7! Not chasing the king, but grabbing the squares in front of the pawn. This is the whole idea: the king leads, the pawn follows.",
      "2... Kf7",
      "3. e6+: Now the pawn advances with the king guarding it.",
      "3... Kf8",
      "4. e7+: One step from glory.",
      "4... Kf7",
      "5. e8=Q+: A new queen, protected by the king on d7. Compare this with pushing the pawn first and the king second, which only leads to stalemate.",
    ],
    outro: "Having the opposition means the OTHER player has to move first and give ground. Count the squares between the kings: an odd number means the player to move is in trouble.",
  },

  "square-outside": {
    title: "The square of the pawn: too far away",
    fen: "8/8/8/8/7k/8/P7/6K1 w - - 0 1",
    line: "a4 Kg5 a5 Kf6 a6 Ke7 a7 Kd7 a8=Q",
    notes: [
      "Here is a shortcut that saves you counting moves. Draw an imaginary square with the pawn and the promotion square as two corners. If the enemy king cannot step INTO that square, the pawn queens.",
      "1. a4: The pawn uses its two-square jump. Black's king is outside the square already.",
      "1... Kg5: The chase begins.",
      "2. a5",
      "2... Kf6",
      "3. a6",
      "3... Ke7",
      "4. a7",
      "4... Kd7",
      "5. a8=Q: The king was always exactly one step too slow. No counting needed.",
    ],
  },

  "square-inside": {
    title: "The square of the pawn: just in time",
    fen: "8/8/8/3k4/8/8/P7/6K1 b - - 0 1",
    line: "Kc5 a4 Kb6 a5 Kxa5",
    notes: [
      "The same pawn, but Black's king starts four files closer. Now it IS inside the square.",
      "1... Kc5: Heading straight for the corner the pawn is running to. Do not chase the pawn; cut it off.",
      "2. a4",
      "2... Kb6",
      "3. a5",
      "3... Kxa5: Caught. The pawn never had a chance, and the game is a draw.",
    ],
  },

  "king-activity": {
    title: "In the endgame, the king is a fighter",
    fen: "8/5p2/4k3/8/8/4K3/5P2/8 w - - 0 1",
    line: "Kd4 Kd6 Ke4 Ke6 f4 f5+ Kd4",
    notes: [
      "For the whole middlegame you hide your king. Once the queens are gone, that changes completely: the king becomes one of your strongest pieces.",
      "1. Kd4: March the king toward the middle of the board.",
      "1... Kd6: Black does the same, keeping the opposition.",
      "2. Ke4",
      "2... Ke6",
      "3. f4: The pawn joins in, backed up by the king.",
      "3... f5+",
      "4. Kd4: The kings are doing the real fighting. In an equal endgame, the player whose king reaches the center first usually wins the pawn race.",
    ],
    outro: "A rule of thumb for the endgame: activate your king before you push your pawns.",
  },
};
