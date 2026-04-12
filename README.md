# C Notebook Backend Engine

## Description

This project is a **pure terminal prototype** of a *****C-based notebook infrastructure*****. It allows you to create, edit, and execute sequential C code blocks called cells. The cells are stored as part of a structured notebook file using the custom state of the art **`.cnb`** file extension.

> [!WARNING]
> This is strictly a backend demonstration for a *****proof-of-concept*****. The full-featured C notebook infrastructure developed by myself is maintained privately for usability and product reasons.

## Project Purpose

- Validate the execution model for sequentially concatenated C code cells.
- Validate save/load mechanics for notebook files using `.cnb` custom format.

## How It Works

1. Each cell contains a snippet of C code.
2. All cells are concatenated together into a temporary C file inside `/memory/`.
3. The program compiles and executes the combined code.
4. The results of each cell are displayed and stored.

## Installation and Build

### Requirements:
- GCC Compiler
- Make

### Download repo

```bash
git clone https://github.com/edujbarrios/C-notebook-backend-engine/
cd C-notebook-backend-engine
```


### Build Instructions:

```bash
make
```

### Run:

```bash
./cnb
```

## Folder Structure

```
include/        → Header files
src/            → Source files
output_cnbs/    → Saved notebooks with .cnb extension
memory/         → Temporary compilation and execution files
frontend/       → Web frontend (Google Colab-like UI)
Makefile        → Build script
README.md       → This file
```

## Commands (Inside Terminal UI)

- `:save` → Saves the current notebook. You will be asked for a filename.
- `:load` → Loads the default notebook file (`examples/notebook.cnb`).
- `:exit` → Exits the program.

## Custom File Extension: `.cnb`

Notebooks are saved using the `.cnb` extension, standing for **C Notebook**.

A `.cnb` file contains:
- The number of cells.
- The code and output of each cell.
- A human-readable but structured format.

### Example File Content:

```
CNOTEBOOK
CELLS:2
---
int total = 10;
<<<
Starting total: 10
---
---
total += 5;
printf("Total: %d", total);
<<<
Total: 15
---
```

## Complex example: DNA sequence

Here's a "complex" example of a saved `.cnb` file after sequentially adding separate cells:

> [!NOTE]
> The *<<<* represents the outputs of the cells in the self creted `.cnb` files.
> More complex cells can be done and work as a real Jupyter Notebook for C, but to do that, it's needed to develop a custom frontend. **This mentioned part is done but remains private.**

````c
CNOTEBOOK
CELLS:4
---
char dna[] = "ATGCGATTACGATCAGCGATCG";
int gc = 0;
int at = 0;
int i;

<<<

---
---
for(i = 0; dna[i] != '\0'; i++) {
    if (dna[i] == 'G' || dna[i] == 'C') gc++;
    if (dna[i] == 'A' || dna[i] == 'T') at++;
}

<<<

---
---
double gc_percent = (double)gc / (gc + at) * 100.0;
printf("DNA sequence: %s\n", dna);
printf("GC-content: %.2f%%\n", gc_percent);

<<<
DNA sequence: ATGCGATTACGATCAGCGATCG
GC-content: 50.00%

---
---
strcpy(dna, "GGCCATGATTTAGGGGCCC");
gc = 0;
at = 0;
for(i = 0; dna[i] != '\0'; i++) {
    if (dna[i] == 'G' || dna[i] == 'C') gc++;
    if (dna[i] == 'A' || dna[i] == 'T') at++;
}
gc_percent = (double)gc / (gc + at) * 100.0;
printf("New DNA: %s\nGC-content: %.2f%%\n", dna, gc_percent);

<<<
DNA sequence: ATGCGATTACGATCAGCGATCG
GC-content: 50.00%
New DNA: GGCCATGATTTAGGGGCCC
GC-content: 63.16%

---
````

## Web Frontend (Google Colab-like UI)

A web-based frontend that emulates Google Colab is available in the `frontend/` directory. It provides:

- **Cell-based editing** with syntax highlighting (CodeMirror)
- **Run individual cells** or **Run All** with real-time output
- **Add, delete, reorder** cells interactively
- **Save/Load** notebooks using the `.cnb` format
- **Keyboard shortcuts**: `Shift+Enter` to run the current cell

### Requirements
- Node.js (v18+)
- GCC Compiler

### Setup & Run (Frontend Only)

```bash
cd frontend
npm install
npm run build
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### How It Works

The frontend consists of:
- **Express server** (TypeScript) — serves the UI and exposes a REST API for cell management, compilation, and `.cnb` file handling
- **Web UI** (HTML/CSS/JS) — single-page application styled after Google Colab with CodeMirror editors for C code

The server compiles C code by concatenating all cells into a single source file and invoking GCC, mirroring the exact same compilation model as the terminal backend.

## Running Backend and Frontend Together

The terminal backend (`cnb`) and the web frontend are two independent interfaces to the same notebook concept. They share the `output_cnbs/` directory for saved `.cnb` files and the `memory/` directory for temporary compilation artifacts, so notebooks saved in one can be loaded in the other.

### Quick Start (both components)

From the project root:

```bash
# 1. Build the terminal backend
make

# 2. Build the web frontend
cd frontend
npm install
npm run build
cd ..
```

### Running the terminal backend

```bash
./cnb
```

This starts the interactive terminal UI. Use `:save`, `:load`, and `:exit` commands as documented above.

### Running the web frontend

```bash
cd frontend
npm start
```

This starts the web server on port 3000 (configurable via the `PORT` environment variable). Open [http://localhost:3000](http://localhost:3000) in your browser.

To run on a custom port:

```bash
PORT=8080 npm start
```

### Using both at the same time

You can run both interfaces simultaneously in separate terminals:

**Terminal 1 — Web frontend:**
```bash
cd frontend && npm start
```

**Terminal 2 — Terminal backend:**
```bash
./cnb
```

Both share the `output_cnbs/` directory, so a notebook saved via the web UI (using the **Save** button) can be loaded in the terminal backend with `:load`, and vice versa.

> [!NOTE]
> Both interfaces use the `memory/` directory for temporary compilation files. If you run a cell from both interfaces at the exact same time, there may be a brief file conflict. In practice this is unlikely, but for safety, avoid compiling from both interfaces simultaneously.

## Author

**Eduardo J. Barrios**  
https://edujbarrios.com
