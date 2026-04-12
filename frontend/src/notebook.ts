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

/** Create a fresh empty notebook */
export function createNotebook(): Notebook {
  return { cells: [] };
}

/** Add a new cell and return its id */
export function addCell(nb: Notebook, code = ""): Cell {
  const cell: Cell = { id: Date.now(), code, output: "" };
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

// ─── .cnb serialisation ────────────────────────────────────────────────

export function saveCnb(nb: Notebook, filename: string): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const safeName = filename.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const filePath = path.join(OUTPUT_DIR, `${safeName}.cnb`);

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
      id: Date.now() + c,
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
  const safeName = name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  return path.join(OUTPUT_DIR, safeName.endsWith(".cnb") ? safeName : `${safeName}.cnb`);
}
