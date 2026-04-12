/* ────────────────────────────────────────────────────────────────────
   C Notebook – Client‑side application
   Google‑Colab‑style notebook UI that communicates with the Express
   backend via fetch() calls.
   ──────────────────────────────────────────────────────────────────── */

// ── State ─────────────────────────────────────────────────────────────
/** @type {{ id: number, code: string, output: string }[]} */
let cells = [];

/** Map cell‑id → CodeMirror instance */
const editors = new Map();

// ── DOM references ────────────────────────────────────────────────────
const $notebook = document.getElementById("notebook");
const $btnRunAll = document.getElementById("btn-run-all");
const $btnSave = document.getElementById("btn-save");
const $btnLoad = document.getElementById("btn-load");
const $btnAdd = document.getElementById("btn-add-cell");
const $overlay = document.getElementById("modal-overlay");
const $modalTitle = document.getElementById("modal-title");
const $modalInput = document.getElementById("modal-input");
const $modalList = document.getElementById("modal-list");
const $modalOk = document.getElementById("modal-ok");
const $modalCancel = document.getElementById("modal-cancel");

// ── API helpers ───────────────────────────────────────────────────────
async function api(url, opts = {}) {
  opts.headers = { "Content-Type": "application/json", ...opts.headers };
  if (opts.body && typeof opts.body !== "string")
    opts.body = JSON.stringify(opts.body);
  const res = await fetch(url, opts);
  return res.json();
}

const API = {
  getNotebook: () => api("/api/notebook"),
  addCell: (afterId) =>
    api("/api/cells", { method: "POST", body: { code: "", afterId } }),
  updateCell: (id, code) =>
    api(`/api/cells/${id}`, { method: "PUT", body: { code } }),
  deleteCell: (id) => api(`/api/cells/${id}`, { method: "DELETE" }),
  runCell: (id) => api(`/api/cells/${id}/run`, { method: "POST" }),
  runAll: () => api("/api/run-all", { method: "POST" }),
  save: (name) => api("/api/save", { method: "POST", body: { name } }),
  load: (name) => api("/api/load", { method: "POST", body: { name } }),
  listNotebooks: () => api("/api/notebooks"),
};

// ── Render ─────────────────────────────────────────────────────────────

function render() {
  $notebook.innerHTML = "";
  editors.clear();

  cells.forEach((cell, idx) => {
    // Wrapper
    const $cell = document.createElement("div");
    $cell.className = "cell";
    $cell.dataset.id = cell.id;

    // Header
    const $header = document.createElement("div");
    $header.className = "cell-header";
    $header.innerHTML = `
      <button class="btn-run" title="Run cell">&#9654;</button>
      <span class="cell-label">[${idx + 1}]</span>
      <button class="btn-up" title="Move up">&#9650;</button>
      <button class="btn-down" title="Move down">&#9660;</button>
      <button class="btn-add-below" title="Add cell below">+</button>
      <button class="btn-delete" title="Delete cell">&#10005;</button>
    `;

    // Editor area
    const $editor = document.createElement("div");
    $editor.className = "cell-editor";

    // Output area
    const $output = document.createElement("div");
    $output.className = "cell-output" + (cell.output ? " visible" : "");
    $output.textContent = cell.output;

    $cell.appendChild($header);
    $cell.appendChild($editor);
    $cell.appendChild($output);
    $notebook.appendChild($cell);

    // CodeMirror
    const cm = CodeMirror($editor, {
      value: cell.code,
      mode: "text/x-csrc",
      theme: "default",
      lineNumbers: true,
      tabSize: 4,
      indentUnit: 4,
      matchBrackets: true,
      autoCloseBrackets: true,
      viewportMargin: Infinity,
      extraKeys: {
        "Shift-Enter": () => runSingleCell(cell.id),
      },
    });

    cm.on("change", () => {
      cell.code = cm.getValue();
      debouncedUpdate(cell.id, cell.code);
    });

    cm.on("focus", () => $cell.classList.add("focused"));
    cm.on("blur", () => $cell.classList.remove("focused"));

    editors.set(cell.id, cm);

    // Button handlers
    $header.querySelector(".btn-run").onclick = () => runSingleCell(cell.id);
    $header.querySelector(".btn-delete").onclick = () => removeCellUI(cell.id);
    $header.querySelector(".btn-up").onclick = () => moveCellUI(cell.id, -1);
    $header.querySelector(".btn-down").onclick = () => moveCellUI(cell.id, 1);
    $header.querySelector(".btn-add-below").onclick = () =>
      addCellBelow(cell.id);
  });
}

// ── Cell operations ───────────────────────────────────────────────────

/** Debounced cell update */
let _updateTimers = {};
function debouncedUpdate(id, code) {
  clearTimeout(_updateTimers[id]);
  _updateTimers[id] = setTimeout(() => API.updateCell(id, code), 400);
}

async function runSingleCell(id) {
  const $cell = document.querySelector(`.cell[data-id="${id}"]`);
  if (!$cell) return;

  // Flush latest code
  const cm = editors.get(id);
  if (cm) {
    const cell = cells.find((c) => c.id === id);
    if (cell) cell.code = cm.getValue();
    await API.updateCell(id, cm.getValue());
  }

  $cell.classList.add("running");
  const $output = $cell.querySelector(".cell-output");
  $output.className = "cell-output visible";
  $output.textContent = "Running…";

  try {
    const data = await API.runCell(id);
    const cell = cells.find((c) => c.id === id);
    if (cell) cell.output = data.cell.output;
    $output.textContent = data.cell.output || "(no output)";
    $output.classList.toggle("error", !data.success);
    $output.classList.toggle("success", data.success);
  } catch (err) {
    $output.textContent = "Request failed: " + err.message;
    $output.classList.add("error");
  }
  $cell.classList.remove("running");
}

async function runAllCells() {
  // Flush all editors
  for (const [id, cm] of editors) {
    const cell = cells.find((c) => c.id === id);
    if (cell) {
      cell.code = cm.getValue();
      await API.updateCell(id, cell.code);
    }
  }

  // Mark all as running
  document.querySelectorAll(".cell").forEach((el) => {
    el.classList.add("running");
    const $out = el.querySelector(".cell-output");
    $out.className = "cell-output visible";
    $out.textContent = "Running…";
  });

  try {
    const data = await API.runAll();
    cells = data.notebook.cells;
    render();
  } catch (err) {
    alert("Run all failed: " + err.message);
  }
}

async function removeCellUI(id) {
  await API.deleteCell(id);
  const data = await API.getNotebook();
  cells = data.cells;
  render();
}

async function moveCellUI(id, dir) {
  const idx = cells.findIndex((c) => c.id === id);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= cells.length) return;
  await api(`/api/cells/${id}/move`, {
    method: "POST",
    body: { newIndex: newIdx },
  });
  const data = await API.getNotebook();
  cells = data.cells;
  render();
}

async function addCellBelow(afterId) {
  await API.addCell(afterId);
  const data = await API.getNotebook();
  cells = data.cells;
  render();
}

async function addCellAtEnd() {
  await API.addCell();
  const data = await API.getNotebook();
  cells = data.cells;
  render();
  // Focus the last editor
  const lastId = cells[cells.length - 1].id;
  setTimeout(() => {
    const cm = editors.get(lastId);
    if (cm) cm.focus();
  }, 50);
}

// ── Modal (Save / Load) ──────────────────────────────────────────────

let _modalResolve = null;

function openModal(title, showInput, items = []) {
  $modalTitle.textContent = title;
  $modalInput.value = "";
  $modalInput.style.display = showInput ? "" : "none";
  $modalList.innerHTML = "";

  items.forEach((name) => {
    const div = document.createElement("div");
    div.className = "notebook-item";
    div.textContent = name;
    div.onclick = () => {
      $modalList
        .querySelectorAll(".notebook-item")
        .forEach((el) => el.classList.remove("selected"));
      div.classList.add("selected");
      $modalInput.value = name;
    };
    $modalList.appendChild(div);
  });

  $overlay.classList.remove("hidden");
  if (showInput) $modalInput.focus();

  return new Promise((resolve) => {
    _modalResolve = resolve;
  });
}

function closeModal(value) {
  $overlay.classList.add("hidden");
  if (_modalResolve) _modalResolve(value);
  _modalResolve = null;
}

$modalOk.onclick = () => closeModal($modalInput.value || null);
$modalCancel.onclick = () => closeModal(null);
$overlay.onclick = (e) => {
  if (e.target === $overlay) closeModal(null);
};

async function saveNotebook() {
  const notebooks = await API.listNotebooks();
  const name = await openModal("Save Notebook", true, notebooks);
  if (!name) return;
  await API.save(name);
}

async function loadNotebook() {
  const notebooks = await API.listNotebooks();
  if (notebooks.length === 0) {
    alert("No saved notebooks found.");
    return;
  }
  const name = await openModal("Load Notebook", false, notebooks);
  if (!name) return;
  const data = await API.load(name);
  cells = data.cells;
  render();
}

// ── Toolbar wiring ────────────────────────────────────────────────────
$btnRunAll.onclick = runAllCells;
$btnSave.onclick = saveNotebook;
$btnLoad.onclick = loadNotebook;
$btnAdd.onclick = addCellAtEnd;

// ── Init ──────────────────────────────────────────────────────────────
(async function init() {
  const data = await API.getNotebook();
  cells = data.cells;
  render();
})();
