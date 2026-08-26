// Shared chrome for every board widget: the board on one side,
// a sentence and some buttons on the other.

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function button(label, className, onClick) {
  const b = el("button", "btn " + (className || ""), label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

export function buildFrame(host, options = {}) {
  host.classList.add("board-widget");
  host.textContent = "";

  if (options.title) {
    const cap = el("figcaption", null, options.title);
    host.appendChild(cap);
  }

  const boardEl = el("div");
  host.appendChild(boardEl);

  const side = el("div", "board-side");
  const statusEl = el("p", "board-status");
  const controlsEl = el("div", "board-controls");

  // A puzzle states its goal before anything else; an explorer's legend
  // is a footnote and belongs underneath.
  if (options.legend && options.legendFirst) {
    side.appendChild(el("p", "board-goal", options.legend));
  }
  side.append(statusEl, controlsEl);

  let listEl = null;
  if (options.moveList) {
    listEl = el("ol", "move-list");
    side.appendChild(listEl);
  }
  if (options.legend && !options.legendFirst) {
    side.appendChild(el("p", "board-legend", options.legend));
  }

  host.appendChild(side);
  return { boardEl, statusEl, controlsEl, listEl, side };
}
