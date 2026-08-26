// Tactics: short, forcing tricks that win material or the game.

export const tactics = {
  fork: {
    title: "The fork",
    fen: "r3k2r/ppp2ppp/8/3N4/8/8/PPP2PPP/R3K2R w KQkq - 0 1",
    line: "Nxc7+ Ke7 Nxa8",
    notes: [
      "A fork is one piece attacking two things at once. Knights are the champions of forking because nobody sees them coming.",
      "1. Nxc7+: The knight grabs a pawn, checks the king AND attacks the rook on a8. The king cannot capture it, because c7 is a knight's move away from e8, not a step away.",
      "1... Ke7: Black must answer the check. The rook is left behind.",
      "2. Nxa8: And the knight collects it. That is a whole rook for one knight move.",
    ],
    outro: "A fork that hits the king and the queen at once is called a royal fork. Always check knight jumps before you move.",
  },

  pin: {
    title: "The pin",
    fen: "rnbqkb1r/ppp1pppp/5n2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 0 4",
    line: "Bg5 e6 Nc3",
    notes: [
      "A pin freezes a piece by putting something more valuable behind it.",
      "1. Bg5: The bishop attacks the knight on f6. If the knight moves, the black queen on d8 is captured. The knight is stuck.",
      "1... e6: Black cannot break the pin yet, so plays a useful move instead.",
      "2. Nc3: White piles up. Attacking a pinned piece again and again is the classic way to win it, because it cannot run away.",
    ],
    outro: "When the piece behind is the KING, the pinned piece is not allowed to move at all. That is called an absolute pin.",
  },

  skewer: {
    title: "The skewer",
    fen: "7q/8/8/4k3/8/8/8/2B1K3 w - - 0 1",
    line: "Bb2+ Kd6 Bxh8",
    notes: [
      "A skewer is a pin turned around: the valuable piece is in FRONT, and when it steps aside you take what was hiding behind it.",
      "1. Bb2+: Check. The king and the queen are on the same diagonal, with the king in front.",
      "1... Kd6: The king has to move; you may never ignore a check.",
      "2. Bxh8: The queen was standing behind the king and is now gone. A bishop just beat a queen.",
    ],
  },

  "discovered-attack": {
    title: "The discovered attack",
    fen: "4k3/8/1q6/8/8/4N3/8/4R2K w - - 0 1",
    line: "Nd5+ Kd7 Nxb6+",
    notes: [
      "The knight is standing in front of the rook. When it steps aside, the rook's attack is 'discovered', and the knight can attack something on the way.",
      "1. Nd5+: Two attacks in one move. The rook now checks the king down the e-file, and the knight attacks the queen on b6.",
      "1... Kd7: Black has to deal with the check first. Checks always come first.",
      "2. Nxb6+: The queen falls, with check. Discovered attacks are the most powerful tactic in chess because the opponent can only answer one threat at a time.",
    ],
  },

  "double-check": {
    title: "Double check",
    fen: "4k3/6b1/8/8/4N3/8/8/4R1K1 w - - 0 1",
    line: "Nf6+ Kd8 Ne4",
    notes: [
      "Sometimes the discovered attack IS a check from both pieces. That is double check, and there is only one answer to it.",
      "1. Nf6+: Double check: the knight checks from f6 and the rook checks up the e-file. Black's bishop on g7 attacks the knight, but capturing it is illegal: the rook would still be giving check.",
      "1... Kd8: Against a double check the king MUST move. Blocking and capturing are both impossible, because no single move can stop two checks.",
      "2. Ne4: Now the knight steps out of the bishop's reach, a whole tempo ahead. Remember double check whenever you see a wild-looking sacrifice: it is usually the reason the sacrifice works.",
    ],
  },

  "removing-the-defender": {
    title: "Removing the defender",
    fen: "3r2k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1",
    line: "Rxd8#",
    notes: [
      "Before you decide a square is protected, ask: who is protecting it, and can I take that piece?",
      "Rxd8#: Black's rook was the only guard on the back rank. White simply removes it, and the capture itself is checkmate. Whenever a mate is 'blocked' by one defender, look for a way to trade it off.",
    ],
  },
};
