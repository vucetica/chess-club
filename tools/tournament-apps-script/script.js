// ============================================================
// CHESS TOURNAMENT MANAGER — Google Apps Script
// Swiss-system tournament for a school chess club.
// ============================================================
//
// RANKINGS SHEET FORMAT (auto-generated from round data):
//   Row 1: Headers → Player | R1 | R2 | … | Score | Wins | Buchholz | Status
//   Row 2+: Player data.
//   Round columns show: 1, 0.5, 0, BYE, or NO SHOW.
//   Status should be "Active" (or blank = Active).
//   Set to "Dropped" to remove from future pairings.
//
// ROUND SHEET FORMAT (auto-generated):
//   Row 1: Title (merged)
//   Row 2: Headers → Player 1 | Player 2 | Result
//   Row 3+: Match data
//
// VALID RESULT VALUES (entered manually after each round):
//   "1-0"              → Player 1 wins, Player 2 loses
//   "0-1"              → Player 1 loses, Player 2 wins
//   "0.5-0.5"          → Draw
//   "1-NO SHOW"        → Player 1 wins, Player 2 was absent
//   "NO SHOW-1"        → Player 1 was absent, Player 2 wins
//   "NO SHOW-NO SHOW"  → Both players absent
//   "BYE"              → Auto-filled for bye recipient (odd player count)
//   "NO SHOW"          → Single player absent, no opponent (manually entered)
//
// SCORING RULES:
//   Numeric results: face value (1, 0.5, or 0 points)
//   BYE:             always 1 point (no win credit)
//   NO SHOW:         1 point for the player's FIRST no-show only,
//                    0 points for every subsequent no-show (no win credit)
//
// BYE ELIGIBILITY:
//   A player who has received a BYE or any NO SHOW is ineligible
//   for a bye in all future rounds.
// ============================================================

// Base headers (round columns inserted dynamically between Player and Score)
const RANKINGS_BASE_HEADERS_LEFT = ["Player"];
const RANKINGS_BASE_HEADERS_RIGHT = ["Score", "Wins", "Buchholz", "Status"];
const VALID_RESULT_FORMATS = [
  "1-0",
  "0-1",
  "0.5-0.5",
  "1-no show",
  "no show-1",
  "no show-no show",
  "bye",
  "no show",
];
const MAX_ROUNDS = 6;

// ============================================================
// MENU
// ============================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Tournament Manager")
    .addItem("Generate Next Round Pairings", "generateSwissPairings")
    .addItem("Recalculate Rankings", "manualUpdateRankings")
    .addSeparator()
    .addItem("Drop Player…", "dropPlayerPrompt")
    .addItem("Reinstate Player…", "reinstatePlayerPrompt")
    .addSeparator()
    .addItem("Initialize Rankings Sheet", "initializeRankingsSheet")
    .addToUi();
}

// ============================================================
// HELPER — build full header row based on number of rounds played
// ============================================================

function buildRankingsHeaders(numRounds) {
  const roundCols = [];
  for (let r = 1; r <= numRounds; r++) {
    roundCols.push("R" + r);
  }
  return [
    ...RANKINGS_BASE_HEADERS_LEFT,
    ...roundCols,
    ...RANKINGS_BASE_HEADERS_RIGHT,
  ];
}

// ============================================================
// INITIALIZATION
// ============================================================

function initializeRankingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Rankings");

  if (!sheet) {
    sheet = ss.insertSheet("Rankings", 0);
  }

  const existingData = sheet.getDataRange().getValues();
  const numRounds = getLastRoundNumber(ss);
  const expectedHeaders = buildRankingsHeaders(numRounds);

  const currentHeaders = existingData.length > 0 ? existingData[0] : [];
  const headersMatch =
    expectedHeaders.length === currentHeaders.length &&
    expectedHeaders.every((h, i) => currentHeaders[i] === h);

  if (headersMatch) {
    const statusCol = expectedHeaders.indexOf("Status") + 1;
    for (let i = 1; i < existingData.length; i++) {
      if (
        !existingData[i][statusCol - 1] ||
        existingData[i][statusCol - 1].toString().trim() === ""
      ) {
        sheet.getRange(i + 1, statusCol).setValue("Active");
      }
    }
    SpreadsheetApp.getUi().alert(
      "Rankings sheet is already set up. Filled in missing Status values.",
    );
    return;
  }

  // Preserve player names from column A
  const playerNames = [];
  if (existingData.length > 1) {
    for (let i = 1; i < existingData.length; i++) {
      const name = existingData[i][0];
      if (name && name.toString().trim() !== "") {
        playerNames.push(name.toString().trim());
      }
    }
  }

  sheet.clear();
  sheet.appendRow(expectedHeaders);
  const headerRange = sheet.getRange(1, 1, 1, expectedHeaders.length);
  headerRange.setFontWeight("bold").setBackground("#d9e1f2").setFontSize(16);
  sheet.setFrozenRows(1);

  for (const name of playerNames) {
    const row = [name];
    for (let r = 0; r < numRounds; r++) row.push("");
    row.push(0, 0, 0, "Active");
    sheet.appendRow(row);
  }

  sheet.autoResizeColumns(1, expectedHeaders.length);
  SpreadsheetApp.getUi().alert(
    `Rankings sheet initialized with ${playerNames.length} player(s). ` +
      `Add players in column A and set Status to "Active".`,
  );
}

// ============================================================
// RESULT PARSING
// ============================================================

/**
 * Parses a result string.
 * Returns an object describing what happened to each player:
 *   p1Display / p2Display — what to show in the rankings round column
 *                           (a number like 1, 0.5, 0, or the string "BYE" / "NO SHOW")
 *   p1Win / p2Win         — true only for actual competitive wins (not byes/no-shows)
 *   isBye                 — true if this row is an odd-player bye
 *   isSoloNoShow          — true if this row is a single-player no-show (no opponent)
 *   p1NoShow / p2NoShow   — true if that player was absent
 * Returns null if the result string is invalid.
 */
function parseResult(resultRaw) {
  if (!resultRaw) return null;
  const result = resultRaw.toString().trim().toLowerCase();

  switch (result) {
    case "1-0":
      return {
        p1Display: 1,
        p2Display: 0,
        p1Win: true,
        p2Win: false,
        isBye: false,
        isSoloNoShow: false,
        p1NoShow: false,
        p2NoShow: false,
      };
    case "0-1":
      return {
        p1Display: 0,
        p2Display: 1,
        p1Win: false,
        p2Win: true,
        isBye: false,
        isSoloNoShow: false,
        p1NoShow: false,
        p2NoShow: false,
      };
    case "0.5-0.5":
      return {
        p1Display: 0.5,
        p2Display: 0.5,
        p1Win: false,
        p2Win: false,
        isBye: false,
        isSoloNoShow: false,
        p1NoShow: false,
        p2NoShow: false,
      };
    case "1-no show":
      return {
        p1Display: 1,
        p2Display: "NO SHOW",
        p1Win: true,
        p2Win: false,
        isBye: false,
        isSoloNoShow: false,
        p1NoShow: false,
        p2NoShow: true,
      };
    case "no show-1":
      return {
        p1Display: "NO SHOW",
        p2Display: 1,
        p1Win: false,
        p2Win: true,
        isBye: false,
        isSoloNoShow: false,
        p1NoShow: true,
        p2NoShow: false,
      };
    case "no show-no show":
      return {
        p1Display: "NO SHOW",
        p2Display: "NO SHOW",
        p1Win: false,
        p2Win: false,
        isBye: false,
        isSoloNoShow: false,
        p1NoShow: true,
        p2NoShow: true,
      };
    case "bye":
      return {
        p1Display: "BYE",
        p2Display: null,
        p1Win: false,
        p2Win: false,
        isBye: true,
        isSoloNoShow: false,
        p1NoShow: false,
        p2NoShow: false,
      };
    case "no show":
      // Single player absent, no opponent — like BYE but counts as a no-show
      return {
        p1Display: "NO SHOW",
        p2Display: null,
        p1Win: false,
        p2Win: false,
        isBye: false,
        isSoloNoShow: true,
        p1NoShow: true,
        p2NoShow: false,
      };
    default:
      return null;
  }
}

// ============================================================
// ROUND SHEET HELPERS
// ============================================================

function getRoundSheets(ss) {
  return ss
    .getSheets()
    .filter((s) => /^Round \d+$/.test(s.getName()))
    .sort((a, b) => {
      return (
        parseInt(a.getName().replace("Round ", "")) -
        parseInt(b.getName().replace("Round ", ""))
      );
    });
}

function getLastRoundNumber(ss) {
  const rounds = getRoundSheets(ss);
  if (rounds.length === 0) return 0;
  return parseInt(rounds[rounds.length - 1].getName().replace("Round ", ""));
}

function getAllMatches(ss) {
  const matches = [];
  for (const sheet of getRoundSheets(ss)) {
    const roundNum = parseInt(sheet.getName().replace("Round ", ""));
    const data = sheet.getDataRange().getValues();
    for (let i = 2; i < data.length; i++) {
      const p1 = data[i][0] ? data[i][0].toString().trim() : "";
      const p2 = data[i][1] ? data[i][1].toString().trim() : "";
      const resultRaw = data[i][2] ? data[i][2].toString().trim() : "";
      if (!p1) continue;
      const parsed = parseResult(resultRaw);
      matches.push({ round: roundNum, p1, p2, result: parsed, resultRaw });
    }
  }
  return matches;
}

// ============================================================
// OPPONENT & BYE / NO-SHOW HISTORY
// ============================================================

function getOpponentHistory(matches) {
  const history = new Map();
  for (const m of matches) {
    if (!m.result) continue;
    if (m.result.isBye || m.result.isSoloNoShow) continue; // no real opponent
    if (m.result.p1NoShow || m.result.p2NoShow) continue; // didn't actually play
    if (!m.p1 || !m.p2) continue;
    if (!history.has(m.p1)) history.set(m.p1, new Set());
    if (!history.has(m.p2)) history.set(m.p2, new Set());
    history.get(m.p1).add(m.p2);
    history.get(m.p2).add(m.p1);
  }
  return history;
}

/**
 * Returns a Set of player names who are INELIGIBLE for a future bye.
 * A player is ineligible if they have ever received a BYE or a NO SHOW.
 */
function getByeIneligible(matches) {
  const ineligible = new Set();
  for (const m of matches) {
    if (!m.result) continue;
    if (m.result.isBye) {
      ineligible.add(m.p1);
    }
    if (m.result.isSoloNoShow) {
      ineligible.add(m.p1);
    }
    if (m.result.p1NoShow) ineligible.add(m.p1);
    if (m.result.p2NoShow) ineligible.add(m.p2);
  }
  return ineligible;
}

// ============================================================
// VALIDATION
// ============================================================

function validateLastRound(ss) {
  const lastRoundNum = getLastRoundNumber(ss);
  if (lastRoundNum === 0) return { valid: true, roundNumber: 0 };

  const sheet = ss.getSheetByName(`Round ${lastRoundNum}`);
  const data = sheet.getDataRange().getValues();
  const errors = [];

  for (let i = 2; i < data.length; i++) {
    const p1 = data[i][0] ? data[i][0].toString().trim() : "";
    const p2 = data[i][1] ? data[i][1].toString().trim() : "";
    const resultRaw = data[i][2] ? data[i][2].toString().trim() : "";

    if (!p1) continue;

    if (!resultRaw) {
      errors.push(`Row ${i + 1}: Result is empty for "${p1}" vs "${p2}".`);
      continue;
    }

    const parsed = parseResult(resultRaw);
    if (!parsed) {
      errors.push(
        `Row ${i + 1}: Invalid result "${resultRaw}" for "${p1}" vs "${p2}". ` +
          `Valid formats: ${VALID_RESULT_FORMATS.join(", ")}`,
      );
    }
  }

  return { valid: errors.length === 0, errors, roundNumber: lastRoundNum };
}

// ============================================================
// RANKINGS UPDATE — recalculates everything from round sheets
// ============================================================

function recalculateRankings(ss, rankingsSheet, options = {}) {
  const { strictNoShow = false, rosterSheet = null } = options;
  const rankingsData = (rosterSheet || rankingsSheet).getDataRange().getValues();
  if (rankingsData.length < 2) return [];

  const matches = getAllMatches(ss);
  const numRounds = getLastRoundNumber(ss);
  const headers = buildRankingsHeaders(numRounds);

  // Read player names and status from current Rankings sheet
  const oldHeaders = rankingsData[0];
  const oldStatusIdx = oldHeaders.indexOf("Status");

  const players = new Map();
  for (let i = 1; i < rankingsData.length; i++) {
    const name = rankingsData[i][0] ? rankingsData[i][0].toString().trim() : "";
    if (!name) continue;
    const status =
      oldStatusIdx >= 0
        ? (rankingsData[i][oldStatusIdx] || "Active").toString().trim()
        : "Active";
    players.set(name, {
      name,
      score: 0,
      wins: 0,
      opponents: [],
      // Direct-game outcomes vs each opponent: "win" | "loss" | "draw"
      headToHead: new Map(),
      status,
      // Round display: holds 1, 0.5, 0, "BYE", "NO SHOW", or "" per round
      roundDisplay: new Array(numRounds).fill(""),
      noShowCount: 0,
    });
  }

  // --- First pass: determine each player's first BYE or NO SHOW round ---
  // A player gets at most 1 free point across all BYEs and NO SHOWs combined.
  const firstFreePointRound = new Map();
  for (const m of matches) {
    if (!m.result) continue;
    if (m.result.isBye && players.has(m.p1) && !firstFreePointRound.has(m.p1)) {
      firstFreePointRound.set(m.p1, m.round);
    }
    if (
      !strictNoShow &&
      (m.result.p1NoShow || m.result.isSoloNoShow) &&
      players.has(m.p1) &&
      !firstFreePointRound.has(m.p1)
    ) {
      firstFreePointRound.set(m.p1, m.round);
    }
    if (
      !strictNoShow &&
      m.result.p2NoShow &&
      players.has(m.p2) &&
      !firstFreePointRound.has(m.p2)
    ) {
      firstFreePointRound.set(m.p2, m.round);
    }
  }

  // --- Second pass: calculate scores and round displays ---
  for (const m of matches) {
    if (!m.result) continue;

    // --- Player 1 ---
    if (players.has(m.p1)) {
      const p = players.get(m.p1);

      if (m.result.isBye) {
        const isFirst = firstFreePointRound.get(m.p1) === m.round;
        if (isFirst) p.score += 1;
        if (m.round >= 1 && m.round <= numRounds) {
          p.roundDisplay[m.round - 1] = "BYE";
        }
      } else if (m.result.isSoloNoShow) {
        // Solo NO SHOW: 1 point only if this is the player's first no-show
        const isFirst = firstFreePointRound.get(m.p1) === m.round;
        if (isFirst) p.score += 1;
        p.noShowCount++;
        if (m.round >= 1 && m.round <= numRounds) {
          p.roundDisplay[m.round - 1] = isFirst ? "BYE/NO SHOW" : "NO SHOW";
        }
        // No opponent to track
      } else if (m.result.p1NoShow) {
        const isFirst = firstFreePointRound.get(m.p1) === m.round;
        if (isFirst) p.score += 1;
        p.noShowCount++;
        if (m.round >= 1 && m.round <= numRounds) {
          p.roundDisplay[m.round - 1] = isFirst ? "BYE/NO SHOW" : "NO SHOW";
        }
        p.opponents.push(m.p2);
      } else {
        const displayVal = m.result.p1Display;
        p.score += typeof displayVal === "number" ? displayVal : 0;
        if (m.result.p1Win) p.wins++;
        if (m.round >= 1 && m.round <= numRounds) {
          p.roundDisplay[m.round - 1] = displayVal;
        }
        p.opponents.push(m.p2);
        if (m.result.p1Win) p.headToHead.set(m.p2, "win");
        else if (m.result.p2Win) p.headToHead.set(m.p2, "loss");
        else p.headToHead.set(m.p2, "draw");
      }
    }

    // --- Player 2 (skip for BYE and solo NO SHOW rows) ---
    if (!m.result.isBye && !m.result.isSoloNoShow && players.has(m.p2)) {
      const p = players.get(m.p2);

      if (m.result.p2NoShow) {
        const isFirst = firstFreePointRound.get(m.p2) === m.round;
        if (isFirst) p.score += 1;
        p.noShowCount++;
        if (m.round >= 1 && m.round <= numRounds) {
          p.roundDisplay[m.round - 1] = isFirst ? "BYE/NO SHOW" : "NO SHOW";
        }
        p.opponents.push(m.p1);
      } else {
        const displayVal = m.result.p2Display;
        p.score += typeof displayVal === "number" ? displayVal : 0;
        if (m.result.p2Win) p.wins++;
        if (m.round >= 1 && m.round <= numRounds) {
          p.roundDisplay[m.round - 1] = displayVal;
        }
        p.opponents.push(m.p1);
        if (m.result.p2Win) p.headToHead.set(m.p1, "win");
        else if (m.result.p1Win) p.headToHead.set(m.p1, "loss");
        else p.headToHead.set(m.p1, "draw");
      }
    }
  }

  // --- Buchholz (sum of opponents' final scores) ---
  for (const [, p] of players) {
    p.buchholz = p.opponents.reduce((sum, oppName) => {
      const opp = players.get(oppName);
      return sum + (opp ? opp.score : 0);
    }, 0);
  }

  // Sort: score desc → head-to-head → buchholz desc → wins desc → random (drawing lots)
  const sorted = Array.from(players.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const h2h = a.headToHead.get(b.name);
    if (h2h === "win") return -1;
    if (h2h === "loss") return 1;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return Math.random() < 0.5 ? -1 : 1;
  });

  // Build output rows: Player | R1 | R2 | … | Score | Wins | Buchholz | Status
  const rows = sorted.map((p) => [
    p.name,
    ...p.roundDisplay,
    p.score,
    p.wins,
    p.buchholz,
    p.status,
  ]);

  // Rewrite sheet
  rankingsSheet.clear();
  rankingsSheet.appendRow(headers);
  const headerRange = rankingsSheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold").setBackground("#d9e1f2").setFontSize(16);
  rankingsSheet.setFrozenRows(1);

  if (rows.length > 0) {
    rankingsSheet
      .getRange(2, 1, rows.length, headers.length)
      .setValues(rows)
      .setFontSize(16);
  }

  rankingsSheet.autoResizeColumns(1, headers.length);
  return sorted;
}

// ============================================================
// ALL-STANDINGS WRAPPER + FINAL SHEET
// ============================================================

/**
 * Recalculates Rankings, Ranking Earned, and Final sheets together.
 * Returns { rankingsSorted, strictSorted } or null if Rankings is missing.
 */
function recalculateAllStandings(ss) {
  const rankingsSheet = ss.getSheetByName("Rankings");
  if (!rankingsSheet) return null;

  const strictSheet =
    ss.getSheetByName("Ranking Earned") || ss.insertSheet("Ranking Earned");
  const finalSheet = ss.getSheetByName("Final") || ss.insertSheet("Final");

  const rankingsSorted = recalculateRankings(ss, rankingsSheet, {
    strictNoShow: false,
  });
  const strictSorted = recalculateRankings(ss, strictSheet, {
    strictNoShow: true,
    rosterSheet: rankingsSheet,
  });

  writeFinalSheet(finalSheet, rankingsSorted, strictSorted);
  return { rankingsSorted, strictSorted };
}

/**
 * Writes the Final sheet: top-3 podium derived from both Rankings and
 * Ranking Earned. A player's Final place is the better (smaller) of their
 * two positions. Dropped players are excluded.
 */
function writeFinalSheet(sheet, rankingsSorted, strictSorted) {
  const rPosMap = new Map();
  rankingsSorted.forEach((p, i) => rPosMap.set(p.name, i + 1));
  const sPosMap = new Map();
  strictSorted.forEach((p, i) => sPosMap.set(p.name, i + 1));

  const finalists = [];
  for (const p of rankingsSorted) {
    if (p.status === "Dropped") continue;
    const r = rPosMap.get(p.name);
    const s = sPosMap.get(p.name);
    if (r === undefined || s === undefined) continue;
    const best = Math.min(r, s);
    if (best <= 3) {
      finalists.push({ name: p.name, best, rPos: r, sPos: s });
    }
  }

  finalists.sort((a, b) => {
    if (a.best !== b.best) return a.best - b.best;
    return a.name.localeCompare(b.name);
  });

  const headers = ["Place", "Player", "Rankings Pos", "Ranking Earned Pos"];
  sheet.clear();
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold").setBackground("#d9e1f2").setFontSize(16);
  sheet.setFrozenRows(1);

  if (finalists.length > 0) {
    const rows = finalists.map((f) => [f.best, f.name, f.rPos, f.sPos]);
    sheet
      .getRange(2, 1, rows.length, headers.length)
      .setValues(rows)
      .setFontSize(16);
  }

  sheet.autoResizeColumns(1, headers.length);
}

/** Menu action: manually recalculate all standings sheets. */
function manualUpdateRankings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rankingsSheet = ss.getSheetByName("Rankings");
  if (!rankingsSheet) {
    SpreadsheetApp.getUi().alert(
      'Rankings sheet not found. Use "Initialize Rankings Sheet" first.',
    );
    return;
  }
  recalculateAllStandings(ss);
  SpreadsheetApp.getUi().alert(
    "Rankings, Ranking Earned, and Final recalculated.",
  );
}

// ============================================================
// TOURNAMENT COMPLETION CHECK
// ============================================================

function checkMatchupsExhausted(activePlayers, opponentHistory) {
  let possiblePairs = 0;
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const a = activePlayers[i].name;
      const b = activePlayers[j].name;
      const aOpps = opponentHistory.get(a) || new Set();
      if (!aOpps.has(b)) possiblePairs++;
    }
  }
  return { exhausted: possiblePairs === 0, possiblePairs };
}

// ============================================================
// SWISS PAIRING ALGORITHM (with backtracking)
// ============================================================

function findPairings(players, opponentHistory) {
  if (players.length === 0) return { success: true, pairs: [], unpaired: null };
  if (players.length === 1)
    return { success: true, pairs: [], unpaired: players[0] };

  const p1 = players[0];
  const rest = players.slice(1);
  const p1Opps = opponentHistory.get(p1.name) || new Set();

  for (let i = 0; i < rest.length; i++) {
    const p2 = rest[i];
    if (p1Opps.has(p2.name)) continue;

    const remaining = [...rest.slice(0, i), ...rest.slice(i + 1)];
    const result = findPairings(remaining, opponentHistory);

    if (result.success) {
      return {
        success: true,
        pairs: [[p1, p2], ...result.pairs],
        unpaired: result.unpaired,
      };
    }
  }

  return { success: false };
}

// ============================================================
// BYE ASSIGNMENT
// ============================================================

/**
 * Selects the bye recipient:
 *   - Must not have previously received a BYE or any NO SHOW.
 *   - Among eligible players, picks the lowest-scored.
 *   - Ties broken randomly.
 */
function selectByePlayer(players, byeIneligible) {
  const eligible = players.filter((p) => !byeIneligible.has(p.name));
  if (eligible.length === 0) return null;

  const lowestScore = eligible[eligible.length - 1].score;
  const candidates = eligible.filter((p) => p.score === lowestScore);

  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

// ============================================================
// MAIN: GENERATE SWISS PAIRINGS
// ============================================================

function generateSwissPairings() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rankingsSheet = ss.getSheetByName("Rankings");

  if (!rankingsSheet) {
    ui.alert(
      'Rankings sheet not found. Use "Initialize Rankings Sheet" first.',
    );
    return;
  }

  // --- Step 1: Validate last round results ---
  const validation = validateLastRound(ss);
  if (!validation.valid) {
    ui.alert(
      `Cannot generate new pairings. Round ${validation.roundNumber} has errors:\n\n` +
        validation.errors.join("\n"),
    );
    return;
  }

  // --- Step 2: Recalculate rankings (all three sheets) ---
  recalculateAllStandings(ss);

  // --- Step 3: Check round limits ---
  const lastRoundNum = getLastRoundNumber(ss);
  const newRoundNum = lastRoundNum + 1;

  if (newRoundNum > MAX_ROUNDS) {
    ui.alert(
      `Tournament is complete. Maximum of ${MAX_ROUNDS} rounds reached.`,
    );
    return;
  }

  if (ss.getSheetByName(`Round ${newRoundNum}`)) {
    ui.alert(`Sheet for Round ${newRoundNum} already exists.`);
    return;
  }

  // --- Step 4: Gather active players ---
  const rankingsData = rankingsSheet.getDataRange().getValues();
  const headers = rankingsData[0];
  const scoreIdx = headers.indexOf("Score");
  const statusIdx = headers.indexOf("Status");

  const activePlayers = [];
  for (let i = 1; i < rankingsData.length; i++) {
    const name = rankingsData[i][0] ? rankingsData[i][0].toString().trim() : "";
    if (!name) continue;
    const status = (rankingsData[i][statusIdx] || "Active").toString().trim();
    if (status === "Dropped") continue;
    activePlayers.push({
      name,
      score: parseFloat(rankingsData[i][scoreIdx]) || 0,
    });
  }

  if (activePlayers.length < 2) {
    ui.alert(
      "Not enough active players to generate pairings (need at least 2).",
    );
    return;
  }

  // --- Step 5: Get history ---
  const allMatches = getAllMatches(ss);
  const opponentHistory = getOpponentHistory(allMatches);
  const byeIneligible = getByeIneligible(allMatches);

  // --- Step 6: Check exhaustion ---
  const exhaustion = checkMatchupsExhausted(activePlayers, opponentHistory);
  if (exhaustion.exhausted) {
    ui.alert(
      "Tournament is complete — all possible matchups have been played.\n" +
        "No more rounds can be generated.",
    );
    return;
  }

  // --- Step 7: Handle odd number — assign bye ---
  let byePlayer = null;
  let playersToPair = [...activePlayers];

  if (playersToPair.length % 2 === 1) {
    byePlayer = selectByePlayer(playersToPair, byeIneligible);
    if (!byePlayer) {
      // Everyone is ineligible — pick lowest-ranked as last resort
      byePlayer = playersToPair[playersToPair.length - 1];
    }
    playersToPair = playersToPair.filter((p) => p.name !== byePlayer.name);
  }

  // --- Step 8: Generate pairings ---
  const pairingResult = findPairings(playersToPair, opponentHistory);

  if (!pairingResult.success) {
    ui.alert(
      "Could not find valid pairings where no player faces a previous opponent.\n" +
        "The tournament may need to end early.",
    );
    return;
  }

  if (pairingResult.unpaired) {
    if (!byePlayer) {
      byePlayer = pairingResult.unpaired;
    } else {
      ui.alert("Error: Two players left unpaired. Please check the data.");
      return;
    }
  }

  // --- Step 9: Build output rows ---
  const pairings = pairingResult.pairs.map(([p1, p2]) => [
    p1.name,
    p2.name,
    "",
  ]);
  if (byePlayer) {
    pairings.push([byePlayer.name, "BYE", "BYE"]);
  }

  // --- Step 10: Create the round sheet ---
  const roundSheet = ss.insertSheet(
    `Round ${newRoundNum}`,
    ss.getSheets().length,
  );

  // Title row
  roundSheet.appendRow([`${ss.getName()} - Round ${newRoundNum} - Matches`]);
  roundSheet.getRange(1, 1, 1, 3).merge();
  roundSheet
    .getRange(1, 1)
    .setHorizontalAlignment("center")
    .setFontSize(16)
    .setFontWeight("bold");

  // Column headers
  roundSheet.appendRow(["Player 1", "Player 2", "Result"]);
  const headerRange = roundSheet.getRange(2, 1, 1, 3);
  headerRange.setFontWeight("bold").setBackground("#d9e1f2").setFontSize(16);
  roundSheet.setFrozenRows(2);

  // Match rows
  if (pairings.length > 0) {
    const dataRange = roundSheet.getRange(3, 1, pairings.length, 3);
    dataRange.setValues(pairings);
    dataRange.setBorder(true, true, true, true, true, true);
    dataRange.setFontSize(16);
  }

  // Data-validation dropdown for Result column (non-bye rows only)
  const nonByeCount = pairings.length - (byePlayer ? 1 : 0);
  if (nonByeCount > 0) {
    const resultValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        "1-0",
        "0-1",
        "0.5-0.5",
        "1-NO SHOW",
        "NO SHOW-1",
        "NO SHOW-NO SHOW",
      ])
      .setAllowInvalid(false)
      .setHelpText("Select the match result.")
      .build();
    roundSheet
      .getRange(3, 3, nonByeCount, 1)
      .setDataValidation(resultValidation);
  }

  roundSheet.autoResizeColumns(1, 3);

  ui.alert(
    `Round ${newRoundNum} pairings created (${pairings.length} match${pairings.length !== 1 ? "es" : ""}).` +
      (byePlayer ? `\n${byePlayer.name} receives a bye.` : ""),
  );
}

// ============================================================
// DROP / REINSTATE PLAYER
// ============================================================

function dropPlayerPrompt() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Drop Player",
    "Enter the exact player name to drop from the tournament:",
    ui.ButtonSet.OK_CANCEL,
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;
  const name = response.getResponseText().trim();
  if (!name) {
    ui.alert("No name entered.");
    return;
  }

  setPlayerStatus(name, "Dropped");
}

function reinstatePlayerPrompt() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Reinstate Player",
    "Enter the exact player name to reinstate:",
    ui.ButtonSet.OK_CANCEL,
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;
  const name = response.getResponseText().trim();
  if (!name) {
    ui.alert("No name entered.");
    return;
  }

  setPlayerStatus(name, "Active");
}

function setPlayerStatus(name, status) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rankingsSheet = ss.getSheetByName("Rankings");

  if (!rankingsSheet) {
    ui.alert("Rankings sheet not found.");
    return;
  }

  const data = rankingsSheet.getDataRange().getValues();
  const headers = data[0];
  const statusIdx = headers.indexOf("Status");
  if (statusIdx < 0) {
    ui.alert(
      "Status column not found in Rankings sheet. Try recalculating rankings first.",
    );
    return;
  }

  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === name) {
      rankingsSheet.getRange(i + 1, statusIdx + 1).setValue(status);
      found = true;
      break;
    }
  }

  if (found) {
    ui.alert(`"${name}" status set to "${status}".`);
  } else {
    ui.alert(`Player "${name}" not found in Rankings sheet.`);
  }
}
