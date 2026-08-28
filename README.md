# JBW Chess Club

The learning site for the chess club run by the **JBW Elementary School PTA**.

It is a static site: plain HTML, CSS and JavaScript with no build step, no dependencies and no
server. Every chessboard on the site is interactive and runs entirely in the visitor's browser.

## What is on the site

| Page | What it teaches |
| --- | --- |
| `index.html` | Welcome page: what the site is, a board to try, and the way in |
| `lessons.html` | The lesson index: eight numbered tiles |
| `pieces.html` | How each piece moves, on boards you can click |
| `special-rules.html` | Castling, en passant, promotion, check/checkmate/stalemate, draws |
| `notation.html` | Algebraic notation, and club and tournament etiquette |
| `checkmates.html` | Back-rank, ladder, K+Q, K+R, Scholar's, smothered, Philidor's Legacy |
| `openings.html` | The three opening rules plus eight named openings |
| `strategy.html` | Forks, pins, skewers, discovered attacks, and strategy ideas |
| `endgames.html` | King activity, the opposition, the square of the pawn |
| `puzzles.html` | Fifteen puzzles; progress is saved in the browser |
| `tests.html` | Self-check page for the rules engine (not linked from the site) |

## Running it locally

The pages use ES modules, so they need to be served over HTTP. Opening `index.html` straight from
the file system will not work.

```sh
cd chess-club
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Publishing to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait a minute, then open the URL GitHub shows you.

Every link and asset path in the site is relative, so it works from a project subpath such as
`https://<user>.github.io/chess-club/`. The `.nojekyll` file stops GitHub from running the pages
through Jekyll.

## Colors

Built from the school colors, navy `#002060` and gold `#FEDA24`, softened so they can carry a
whole page without shouting.

The navy is dark enough to be text, so it does the heavy lifting: headings, links, buttons and the
active nav item. The gold cannot be text on a light background at any readable contrast, so it is
only ever a fill with dark navy on top of it: the club mark, the "rule" callouts, and the
highlighted squares on the board. Dark mode flips the page to the school navy itself and lets the
gold carry the warmth.

The board is a soft blue rather than the usual wood, which is what ties the lessons to the rest of
the site. Every color is a CSS variable in `assets/css/site.css`, so the board is three tokens
(`--sq-light`, `--sq-dark`, `--board-frame`) if it ever needs to go back to walnut.

Every text pairing meets WCAG AA, and most reach AAA. The pairs worth knowing about, because they
are the ones that break if you change a token: `--on-accent` is the text that sits on `--accent`,
`--on-gold` sits on `--gold`, `--on-good` sits on the Solved badge, and `--gold-ink` is the only
gold safe to use as text. `--focus-board` is deliberately separate from `--focus`, because a blue
focus ring on a blue board is invisible.

## Typefaces

The site uses whatever typeface the reader's device already has: San Francisco on Mac and iPhone,
Segoe UI on Windows, Roboto on Android, with Arial as the last resort. Nothing is downloaded, so
there are no font files to ship, nothing to license, and no request to a font CDN. Text renders on
the first paint instead of flashing.

All four stacks are CSS variables at the top of `assets/css/site.css`, so changing a typeface is a
one-line edit:

```css
--font-ui     headings, navigation, buttons
--font-body   paragraphs (currently the same as --font-ui)
--font-mono   chess notation
--font-chess  the Unicode piece glyphs on the boards
```

## Getting around

There is no menu. The site is small and linear, so two paths cover it:

- **Every page header** has the club mark, which goes home, and an **All lessons** button, which
  goes to `lessons.html`. The header is sticky, so both are always one tap away.
- **Every lesson ends** with a previous / next pair of cards carrying the lesson number, title and
  a one-line summary, with **All lessons** between them.

A dropdown menu was tried and dropped: nine items with subtitles cannot fit a phone header without
becoming a second screen, and the lesson index already does that job better.

## How the site is put together

```
assets/css/site.css          layout, type, color, dark mode, print styles
assets/css/board.css         the board, the pieces, the highlights
assets/js/core/chess.js      the rules: move generation, check/mate, notation
assets/js/core/board-view.js draws a position and reports clicks
assets/js/widgets/           explorer (click a piece), stepper (walkthroughs), puzzle
assets/js/main.js            the single entry point every page loads
assets/data/*.js             all lesson content: openings, checkmates, tactics, puzzles…
```

Pages declare boards with plain markup, and `assets/js/widgets/mount.js` brings them to life:

```html
<figure data-widget="explorer" data-fen="7k/8/8/3N4/8/8/8/K7 w - - 0 1"></figure>
<figure data-widget="stepper"  data-lesson="openings/italian"></figure>
<figure data-widget="puzzle"   data-lesson="puzzles/m1-01"></figure>
```

### Adding a lesson

1. Add an entry to the right file in `assets/data/`: a starting `fen` (leave it out for the normal
   starting position), a `line` of moves in ordinary chess notation, and one `notes` entry per
   position (the first note describes the starting position).
2. Drop a `<figure data-widget="stepper" data-lesson="topic/your-id"></figure>` into the page.
3. Open `tests.html` and confirm every check still passes. It replays every lesson line and
   re-verifies every puzzle answer, so an illegal move or a miscounted note will be caught there.

A puzzle's `solutions` is a list, because a position can have more than one right answer and a board
that rejects a good move teaches the wrong thing. Each entry is one complete line. For the mate
puzzles, `tests.html` works out every forced mate the position allows and fails if one of them is
not listed.

## Also in this repository

`tools/tournament-apps-script/script.js` is the Google Apps Script that runs Swiss-system pairings and
standings for club tournaments in Google Sheets. It is unrelated to the website; paste it into the
Apps Script editor attached to the tournament spreadsheet.
