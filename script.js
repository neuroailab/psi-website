const state = {
  tokens: [],
  equation: {
    inputs: [],
    output: "",
  },
  dragPayload: null,
  loading: true,
  loadError: false,
  defaultsApplied: false,
};

const DEFAULT_EQUATION = {
  inputs: ["rgb0"],
  output: "rgb1",
};

const FALLBACK_TOKENS = ["rgb0", "rgb1", "rgb2", "f01", "dense(f01)", "d0", "d1", "d2", "poke"];

const tokenBankEl = document.getElementById("tokenBank");
const visualizerEl = document.getElementById("visualizer");
const inputsZoneEl = document.getElementById("inputsZone");
const outputZoneEl = document.getElementById("outputZone");
const equationNotationEl = document.getElementById("equationNotation");

function getTokenFamily(token) {
  if (/^rgb/i.test(token)) {
    return "rgb";
  }
  if (/^poke/i.test(token)) {
    return "control";
  }
  if (/^dense/i.test(token) || /^f/i.test(token)) {
    return "feature";
  }
  if (/^d/i.test(token)) {
    return "depth";
  }
  return "custom";
}

function tokenMarkup(token, options = {}) {
  const source = options.source || "bank";
  const side = options.side || "";
  const index = Number.isInteger(options.index) ? String(options.index) : "";
  const removable = Boolean(options.removable);

  return `
    <div
      class="token-box token-box--${getTokenFamily(token)}"
      draggable="true"
      data-token="${token}"
      data-source="${source}"
      data-side="${side}"
      data-index="${index}"
      role="button"
      tabindex="0"
      aria-label="Drag ${token}"
    >
      <span class="token-box__stripe" aria-hidden="true"></span>
      <span class="token-box__label">${token}</span>
      ${
        removable
          ? `<button class="token-box__remove" type="button" data-action="remove-token" data-side="${side}" data-index="${index}" aria-label="Remove ${token}">&times;</button>`
          : ""
      }
    </div>
  `;
}

function imageCardMarkup(token, output = false) {
  return `
    <figure class="image-card ${output ? "image-card--output" : ""}">
      <img src="${getPngPath(token)}" alt="${token}" />
      <figcaption>${token}</figcaption>
    </figure>
  `;
}

function emptyImageCardMarkup(label) {
  return `
    <div class="image-card--empty">
      <span>${label}</span>
    </div>
  `;
}

function getPngPath(token) {
  return `assets/visuals/${encodeURIComponent(token)}.png`;
}

function getEquationNotation() {
  const lhs = state.equation.inputs.length ? state.equation.inputs.join(", ") : "...";
  const rhs = state.equation.output || "...";
  return `${lhs} -> ${rhs}`;
}

function renderTokenBank() {
  if (state.loading) {
    tokenBankEl.innerHTML = `<p class="token-bank__status">Loading PNG tokens...</p>`;
    return;
  }

  if (state.loadError || !state.tokens.length) {
    tokenBankEl.innerHTML = `
      <p class="token-bank__status">
        No PNG-backed tokens were found in <code>assets/visuals</code>.
      </p>
    `;
    return;
  }

  tokenBankEl.innerHTML = state.tokens.map((token) => tokenMarkup(token)).join("");
}

function renderEquation() {
  inputsZoneEl.innerHTML = state.equation.inputs.length
    ? state.equation.inputs
        .map((token, index) =>
          tokenMarkup(token, {
            source: "equation",
            side: "inputs",
            index,
            removable: true,
          }),
        )
        .join("")
    : `<span class="drop-zone__hint">Drop inputs here</span>`;

  outputZoneEl.innerHTML = state.equation.output
    ? tokenMarkup(state.equation.output, {
        source: "equation",
        side: "output",
        index: 0,
        removable: true,
      })
    : `<span class="drop-zone__hint">Drop output here</span>`;

  equationNotationEl.textContent = getEquationNotation();
}

function renderVisualizer() {
  const hasInputs = state.equation.inputs.length > 0;
  const hasOutput = Boolean(state.equation.output);

  if (!hasInputs && !hasOutput) {
    visualizerEl.innerHTML = `
      <p class="visualizer__empty">
        Drag PNG-backed tokens into the equation below and their images will
        appear here.
      </p>
    `;
    return;
  }

  visualizerEl.innerHTML = `
    <div class="visualizer__content">
      <div class="visualizer__inputs">
        ${state.equation.inputs.map((token) => imageCardMarkup(token)).join("")}
      </div>
      <div class="visualizer__arrow" aria-hidden="true">→</div>
      ${
        hasOutput
          ? imageCardMarkup(state.equation.output, true)
          : emptyImageCardMarkup("Output")
      }
    </div>
  `;
}

function render() {
  renderTokenBank();
  renderEquation();
  renderVisualizer();
}

function removeToken(side, index) {
  if (side === "inputs") {
    state.equation.inputs.splice(index, 1);
    return;
  }

  if (side === "output") {
    state.equation.output = "";
  }
}

function placeToken(payload, targetSide) {
  if (!payload?.token || !state.tokens.includes(payload.token)) {
    return;
  }

  if (payload.source === "equation") {
    removeToken(payload.side, payload.index);
  }

  if (targetSide === "inputs") {
    state.equation.inputs.push(payload.token);
  } else {
    state.equation.output = payload.token;
  }
}

function clearDropHighlights() {
  document.querySelectorAll(".drop-zone.is-hovered").forEach((zone) => {
    zone.classList.remove("is-hovered");
  });
}

function applyTokens(tokens) {
  state.tokens = tokens;
  state.equation.inputs = state.equation.inputs.filter((token) => tokens.includes(token));
  if (!tokens.includes(state.equation.output)) {
    state.equation.output = "";
  }

  if (!state.defaultsApplied) {
    const defaultInputs = DEFAULT_EQUATION.inputs.filter((token) => tokens.includes(token));
    const defaultOutput = tokens.includes(DEFAULT_EQUATION.output) ? DEFAULT_EQUATION.output : "";
    if (defaultInputs.length || defaultOutput) {
      state.equation.inputs = defaultInputs;
      state.equation.output = defaultOutput;
    }
    state.defaultsApplied = true;
  }
}

function parseDragPayload(event) {
  const raw = event.dataTransfer?.getData("text/plain");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return state.dragPayload;
    }
  }

  return state.dragPayload;
}

document.addEventListener("dragstart", (event) => {
  const token = event.target.closest(".token-box[draggable='true']");
  if (!token) {
    return;
  }

  const payload = {
    token: token.dataset.token,
    source: token.dataset.source,
    side: token.dataset.side || "",
    index: Number(token.dataset.index || 0),
  };

  state.dragPayload = payload;
  token.classList.add("is-drag-source");
  document.body.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = payload.source === "bank" ? "copy" : "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
});

document.addEventListener("dragend", (event) => {
  const token = event.target.closest(".token-box[draggable='true']");
  if (token) {
    token.classList.remove("is-drag-source");
  }
  state.dragPayload = null;
  clearDropHighlights();
  document.body.classList.remove("is-dragging");
});

document.addEventListener("dragover", (event) => {
  const zone = event.target.closest(".drop-zone");
  if (!zone) {
    return;
  }

  event.preventDefault();
  clearDropHighlights();
  zone.classList.add("is-hovered");
});

document.addEventListener("dragleave", (event) => {
  const zone = event.target.closest(".drop-zone");
  if (!zone) {
    return;
  }

  if (zone.contains(event.relatedTarget)) {
    return;
  }

  zone.classList.remove("is-hovered");
});

document.addEventListener("drop", (event) => {
  const zone = event.target.closest(".drop-zone");
  if (!zone) {
    return;
  }

  event.preventDefault();
  const payload = parseDragPayload(event);
  clearDropHighlights();

  if (!payload?.token) {
    return;
  }

  placeToken(payload, zone.dataset.side);
  render();
  document.body.classList.remove("is-dragging");
});

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  if (action === "refresh-assets") {
    loadPngTokens(true);
    return;
  }

  if (action === "clear-equation") {
    state.equation.inputs = [];
    state.equation.output = "";
    render();
    return;
  }

  if (action === "remove-token") {
    removeToken(actionTarget.dataset.side, Number(actionTarget.dataset.index || 0));
    render();
    return;
  }

  if (action === "copy-code") {
    const codeEl = document.getElementById("quickstart-code");
    if (!codeEl) {
      return;
    }
    const text = codeEl.innerText;
    const original = actionTarget.textContent;
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        actionTarget.textContent = "Copied";
        setTimeout(() => {
          actionTarget.textContent = original;
        }, 1400);
      })
      .catch(() => {
        actionTarget.textContent = "Copy failed";
        setTimeout(() => {
          actionTarget.textContent = original;
        }, 1400);
      });
  }
});

async function loadPngTokens(forceRefresh = false) {
  state.loading = true;
  state.loadError = false;
  render();

  try {
    const response = await fetch(`assets/visuals/?t=${forceRefresh ? Date.now() : "latest"}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load asset listing: ${response.status}`);
    }

    const html = await response.text();
    const documentFragment = new DOMParser().parseFromString(html, "text/html");
    const tokens = [...documentFragment.querySelectorAll("a")]
      .map((link) => decodeURIComponent(link.getAttribute("href") || ""))
      .filter((href) => /\.png$/i.test(href))
      .map((href) => href.split("/").pop().replace(/\.png$/i, ""))
      .filter(Boolean)
      .filter((token, index, collection) => collection.indexOf(token) === index)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    applyTokens(tokens);
  } catch (error) {
    state.loadError = false;
    applyTokens(FALLBACK_TOKENS);
  } finally {
    state.loading = false;
    render();
  }
}

loadPngTokens();
