// Remembers which puzzles a player has solved, on their own device.
// Nothing leaves the browser: there is no server behind this site.

const KEY = "jbw-chess-solved";

function read() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function isSolved(id) {
  return read().has(id);
}

export function markSolved(id) {
  const set = read();
  if (set.has(id)) return;
  set.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* private browsing: the puzzles still work, they just do not stick */
  }
  document.dispatchEvent(new CustomEvent("puzzle-solved", { detail: { id } }));
}

export function solvedCount(ids) {
  const set = read();
  return ids.filter((id) => set.has(id)).length;
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent("puzzle-solved", { detail: { id: null } }));
}
