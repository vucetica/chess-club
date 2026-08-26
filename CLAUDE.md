# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static site that teaches chess to the JBW Chess Club at J. B. Watkins Elementary School.
It is published on GitHub Pages. Audience is grades 2 to 5.

## Hard constraints

These are design decisions, not accidents. Do not undo them without being asked.

- **No dependencies, no build step, no server.** Everything is hand-written HTML, CSS and
  JavaScript. Do not add a bundler, a framework, a package.json, or a CDN `<link>` or `<script>`.
  The site has to keep working offline, on a filtered school network, and years from now.
- **No web fonts.** The site uses the reader's own system font stack. Font choices were rejected
  twice in favour of plain and familiar, so propose the system stack first.
- **All paths relative.** A project Pages site is served from `https://<user>.github.io/chess-club/`,
  so a leading `/` breaks every link.
- **No em dashes** anywhere: site copy, code comments, commit messages, docs. Use a comma, colon,
  parentheses or a period.

## Commands

```sh
python3 -m http.server 8000     # then open http://localhost:8000/
```

A server is required. ES modules do not load over `file://`.

**Tests: open `http://localhost:8000/tests.html`.** There is no test runner and no CI. That page is
the whole suite and it must read "All 97 checks passed". It runs in the browser and covers:

- `perft` move-generation counts against the five published reference positions
- **legality of every starting position**: a board where the side not to move is already in
  check could not have arisen in a real game, so it fails
- checkmate and stalemate detection
- a notation round trip (parse then re-format a whole game)
- **every lesson line replayed for legality, with note counts matched to positions**
- **every puzzle re-proved**: each listed line verified as a forced mate in the number claimed, or
  as actually winning material
- **completeness of the mate puzzles**: it works out every forced mate the position allows and fails
  if one is missing from `solutions`, because a puzzle that rejects a genuinely correct move teaches
  the wrong thing

Those last three are the important part: content errors are caught by the tests, not by review. Any
change to `assets/data/*.js` must be followed by a look at `tests.html`.

To check a single thing quickly, the engine is importable in Node without a browser:

```sh
node --input-type=module -e "
  const {Position, perft, playLine} = await import('./assets/js/core/chess.js');
  console.log(perft(Position.fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'), 3));
"
```

## Architecture

Everything on the site is driven by one small chess engine. The layers only depend downward.

```
assets/js/core/chess.js        the rules. No AI, no search, no evaluation.
assets/js/core/board-view.js   draws a Position, reports clicks. Knows no rules.
assets/js/widgets/*.js         explorer, stepper, puzzle. Decide what a click means.
assets/js/widgets/mount.js     scans the DOM for [data-widget] and builds them
assets/data/*.js               all lesson content
assets/js/main.js              the single entry point every page loads
```

**`chess.js`** answers two questions: which moves are legal here, and is this checkmate. `Position`
is immutable, so `makeMove()` returns a new one. That is deliberate: the stepper keeps an array of
positions and Back is just an index going down, with no unmake logic. It also parses and formats
SAN (`Nbd2`, `O-O`, `e8=Q`, `Qxf7#`), which is why lesson content can be written the way a
scoresheet is written.

**Pages are declarative.** HTML never calls JavaScript directly; it declares a widget and
`mount.js` wires it:

```html
<figure data-widget="explorer" data-fen="7k/8/8/3N4/8/8/8/K7 w - - 0 1"></figure>
<figure data-widget="stepper"  data-lesson="openings/italian"></figure>
<figure data-widget="puzzle"   data-lesson="puzzles/m1-01"></figure>
```

`data-lesson` is a `topic/id` key resolved by `findLesson()` in `assets/data/lessons.js`.
Attributes on the element override the lesson file, so a page can reuse a position with its own
caption.

**The three widgets:** *explorer* highlights a clicked piece's legal moves (and will happily
generate for whichever side you click, not just the side to move, so a learner can poke at both
armies). *stepper* walks a move list with a note per move. *puzzle* checks a played move against the
stored solutions, and also accepts any move that simply delivers mate.

A puzzle position can have more than one right answer, so `solutions` is a **list of complete
lines**, not one line. The widget keeps the lines still consistent with what has been played and
narrows them as the puzzle proceeds, which matters because two lines can share a first move and then
diverge, or need different opponent replies. Do not collapse this back to a single string.

**Chess pieces are Unicode glyphs**, and both colours use the *solid* characters (`♚♛♜`) tinted with
CSS. Using the outline characters for White is the trap: several platforms substitute a different
font and the two armies stop matching. `paint-order: stroke fill` is required, or the dark outline
eats into the white fill and both sides look black.

## Adding content

1. Add an entry to the right file in `assets/data/`: an optional starting `fen` (omit for the normal
   starting position), a `line` of moves in ordinary notation, and one `notes` entry **per position**
   (so `notes[0]` describes the starting position, and the array is one longer than the move count).
2. Drop a `<figure data-widget="stepper" data-lesson="topic/your-id"></figure>` into the page.
3. Open `tests.html`. An illegal move or a miscounted `notes` array fails there.

Puzzles additionally need `level` (`mate1`, `material` or `mate2`), a `solutions` array whose lines
each match the level's length (1 move for `mate1`, 3 for `mate2`), a `hint`, and an `id` that
`puzzles.html` and the progress bar pick up. For a mate puzzle, run the position past the solver
before you commit: `tests.html` will fail if there is a forced mate you did not list.

## Styling

Colour and typography are CSS variables at the top of `assets/css/site.css`, defined once for light
mode and redefined under `prefers-color-scheme: dark`. Change a token, not a rule.

The palette is built from the school colours, navy `#002060` and gold `#FEDA24`. The navy is dark
enough to be text; **the gold is never text on a light background** and appears only as a fill with
dark navy on top of it. Some pairings are load-bearing and will silently fail contrast if you edit
one half: `--on-accent` sits on `--accent`, `--on-gold` on `--gold`, `--on-good` on the Solved
badge, `--gold-ink` is the only gold safe as text, and `--focus-board` is separate from `--focus`
because a blue focus ring on a blue board cannot be seen.

## Navigation

There is no menu, on purpose. Nine items with subtitles cannot fit a phone header. Instead: the
sticky header has the club mark (goes home) and one **All lessons** button (goes to `lessons.html`),
and every lesson ends with previous / next cards plus an All lessons link. `index.html` welcomes and
points at the lessons; `lessons.html` is the eight numbered tiles. Adding or reordering lessons
means editing the stepper cards at the bottom of the affected pages by hand, since there is no
templating.

## Also in this repository

`tools/tournament-apps-script/script.js` is a Google Apps Script that runs Swiss-system pairings and
standings for club tournaments in a spreadsheet. It is unrelated to the website, is pasted into the
Apps Script editor by hand, and is not served. Leave it alone unless asked.
