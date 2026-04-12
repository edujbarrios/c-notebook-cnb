import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.resolve(__dirname, "../../output_cnbs");

export interface Cell {
  id: number;
  code: string;
  output: string;
}

export interface Notebook {
  cells: Cell[];
}

/** Monotonically increasing counter for unique cell IDs */
let nextCellId = 1;

/** Create a fresh empty notebook */
export function createNotebook(): Notebook {
  return { cells: [] };
}

/** Add a new cell and return its id */
export function addCell(nb: Notebook, code = ""): Cell {
  const cell: Cell = { id: nextCellId++, code, output: "" };
  nb.cells.push(cell);
  return cell;
}

/** Delete a cell by id; returns true if found */
export function deleteCell(nb: Notebook, cellId: number): boolean {
  const idx = nb.cells.findIndex((c) => c.id === cellId);
  if (idx === -1) return false;
  nb.cells.splice(idx, 1);
  return true;
}

/** Move a cell to a new position */
export function moveCell(
  nb: Notebook,
  cellId: number,
  newIndex: number
): boolean {
  const idx = nb.cells.findIndex((c) => c.id === cellId);
  if (idx === -1 || newIndex < 0 || newIndex >= nb.cells.length) return false;
  const [cell] = nb.cells.splice(idx, 1);
  nb.cells.splice(newIndex, 0, cell);
  return true;
}

// ─── Path safety ───────────────────────────────────────────────────────

/**
 * Sanitise a user-provided name so it is a safe, flat filename component.
 * Only alphanumerics, hyphens, and underscores are allowed.
 */
function sanitiseFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

/**
 * Build a safe absolute path inside OUTPUT_DIR.
 * Throws if the resolved path escapes the output directory.
 */
function safePath(name: string): string {
  const safeName = sanitiseFilename(name);
  const resolved = path.resolve(OUTPUT_DIR, `${safeName}.cnb`);
  if (!resolved.startsWith(OUTPUT_DIR + path.sep) && resolved !== OUTPUT_DIR) {
    throw new Error("Invalid notebook path");
  }
  return resolved;
}

// ─── .cnb serialisation ────────────────────────────────────────────────

export function saveCnb(nb: Notebook, filename: string): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = safePath(filename);

  const lines: string[] = ["CNOTEBOOK", `CELLS:${nb.cells.length}`];
  for (const cell of nb.cells) {
    lines.push("---");
    lines.push(cell.code);
    lines.push("<<<");
    lines.push(cell.output);
    lines.push("---");
  }
  fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");
  return filePath;
}

export function loadCnb(filePath: string): Notebook | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  if (lines.length < 2 || !lines[0].startsWith("CNOTEBOOK")) return null;

  const cellCountMatch = lines[1].match(/^CELLS:(\d+)$/);
  if (!cellCountMatch) return null;
  const cellCount = parseInt(cellCountMatch[1], 10);

  const nb = createNotebook();
  let i = 2;

  for (let c = 0; c < cellCount; c++) {
    // expect "---"
    while (i < lines.length && !lines[i].startsWith("---")) i++;
    i++; // skip "---"

    // read code until "<<<" 
    const codeLines: string[] = [];
    while (i < lines.length && !lines[i].startsWith("<<<")) {
      codeLines.push(lines[i]);
      i++;
    }
    i++; // skip "<<<"

    // read output until "---"
    const outputLines: string[] = [];
    while (i < lines.length && !lines[i].startsWith("---")) {
      outputLines.push(lines[i]);
      i++;
    }
    i++; // skip "---"

    nb.cells.push({
      id: nextCellId++,
      code: codeLines.join("\n"),
      output: outputLines.join("\n"),
    });
  }
  return nb;
}

export function listNotebooks(): string[] {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".cnb"))
    .map((f) => f.replace(/\.cnb$/, ""));
}

export function getNotebookPath(name: string): string {
  return safePath(name);
}
