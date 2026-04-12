import express from "express";
import path from "path";
import {
  Notebook,
  createNotebook,
  addCell,
  deleteCell,
  moveCell,
  saveCnb,
  loadCnb,
  listNotebooks,
  getNotebookPath,
} from "./notebook";
import { compileAndRun } from "./compiler";

const app = express();
const rawPort = parseInt(process.env.PORT || "3000", 10);
const PORT = Number.isFinite(rawPort) && rawPort >= 1 && rawPort <= 65535
  ? rawPort
  : 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../public")));

// ─── In‑memory state ──────────────────────────────────────────────────
let notebook: Notebook = createNotebook();
// Start with one empty cell
addCell(notebook);

// ─── API Routes ───────────────────────────────────────────────────────

/** Get the full notebook state */
app.get("/api/notebook", (_req, res) => {
  res.json(notebook);
});

/** Add a new cell */
app.post("/api/cells", (req, res) => {
  const code: string = req.body?.code ?? "";
  const afterId: number | undefined = req.body?.afterId;

  const cell = addCell(notebook, code);

  // If afterId is specified, move the new cell right after it
  if (afterId !== undefined) {
    const afterIdx = notebook.cells.findIndex((c) => c.id === afterId);
    if (afterIdx !== -1) {
      // The new cell is at the end; move it to afterIdx + 1
      moveCell(notebook, cell.id, afterIdx + 1);
    }
  }

  res.json(cell);
});

/** Update a cell's code */
app.put("/api/cells/:id", (req, res) => {
  const id = Number(req.params.id);
  const cell = notebook.cells.find((c) => c.id === id);
  if (!cell) return res.status(404).json({ error: "Cell not found" });

  if (req.body.code !== undefined) cell.code = req.body.code;
  res.json(cell);
});

/** Delete a cell */
app.delete("/api/cells/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!deleteCell(notebook, id))
    return res.status(404).json({ error: "Cell not found" });
  // Ensure at least one cell always exists
  if (notebook.cells.length === 0) addCell(notebook);
  res.json({ ok: true });
});

/** Move a cell */
app.post("/api/cells/:id/move", (req, res) => {
  const id = Number(req.params.id);
  const newIndex: number = req.body?.newIndex;
  if (newIndex === undefined)
    return res.status(400).json({ error: "newIndex required" });
  if (!moveCell(notebook, id, newIndex))
    return res.status(400).json({ error: "Invalid move" });
  res.json(notebook);
});

/** Run a single cell (compiles all cells up to that index) */
app.post("/api/cells/:id/run", async (req, res) => {
  const id = Number(req.params.id);
  const idx = notebook.cells.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: "Cell not found" });

  const codes = notebook.cells.map((c) => c.code);
  const result = await compileAndRun(codes, idx);
  notebook.cells[idx].output = result.output;
  res.json({ cell: notebook.cells[idx], success: result.success });
});

/** Run all cells sequentially */
app.post("/api/run-all", async (_req, res) => {
  const results: { cellId: number; success: boolean }[] = [];
  for (let i = 0; i < notebook.cells.length; i++) {
    const codes = notebook.cells.map((c) => c.code);
    const result = await compileAndRun(codes, i);
    notebook.cells[i].output = result.output;
    results.push({ cellId: notebook.cells[i].id, success: result.success });
  }
  res.json({ notebook, results });
});

/** Save notebook */
app.post("/api/save", (req, res) => {
  const name: string = req.body?.name;
  if (!name) return res.status(400).json({ error: "name required" });
  const filePath = saveCnb(notebook, name);
  res.json({ ok: true, path: filePath });
});

/** Load notebook */
app.post("/api/load", (req, res) => {
  const name: string = req.body?.name;
  if (!name) return res.status(400).json({ error: "name required" });
  const filePath = getNotebookPath(name);
  const loaded = loadCnb(filePath);
  if (!loaded)
    return res.status(404).json({ error: "Notebook not found or invalid" });
  notebook = loaded;
  if (notebook.cells.length === 0) addCell(notebook);
  res.json(notebook);
});

/** List saved notebooks */
app.get("/api/notebooks", (_req, res) => {
  res.json(listNotebooks());
});

// ─── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`C Notebook frontend running at http://localhost:${PORT}`);
});
