# C Notebook

## Description

C Notebook is a notebook environment for writing and running C code in reusable cells, then saving that work as `.cnb` notebooks.

It provides two interfaces that share the same `.cnb` format:

- **backend/**: terminal C notebook engine
- **frontend/**: web UI (Google Colab-like)

Both interfaces compile and execute C code with GCC and share notebook storage, so notebooks created in one interface can be opened in the other.

## Direct Execution (Recommended)

### Requirements
- GCC
- Make
- Node.js (v18+)

From the repository root, run:

```bash
npm install && npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

This command flow:
1. Installs frontend dependencies (via `postinstall`)
2. Builds the C backend
3. Builds the TypeScript frontend
4. Starts the web server

## Alternative (Make)

```bash
make install
make dev
```

This performs the same build-and-run flow using `make`.

## Repository Structure

```
package.json   → Root orchestration scripts (all-in-one build & run)
Makefile       → Root Makefile for make-based workflow
backend/       → C terminal backend, build files, memory, and saved notebooks
frontend/      → Web frontend (TypeScript + Express + static UI)
```

## Backend Only (Terminal)

### Build & Run

```bash
cd backend
make
./cnb
```

### Terminal Commands
- `:save` → Save current notebook
- `:load` → Load default notebook
- `:exit` → Exit

Backend data paths:
- `backend/output_cnbs/` for saved `.cnb` notebooks
- `backend/memory/` for temporary compilation artifacts

## Frontend Only (Web UI)

### Build & Run

```bash
cd frontend
npm install
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

The frontend API compiles C cells with GCC and stores notebooks in `backend/output_cnbs/`, sharing notebook data with the terminal backend.

## npm Scripts Reference

| Script | Description |
|---|---|
| `npm install` | Installs frontend dependencies (via postinstall) |
| `npm run build` | Builds both backend (make) and frontend (tsc) |
| `npm run build:backend` | Builds only the C backend |
| `npm run build:frontend` | Builds only the TypeScript frontend |
| `npm start` | Starts the web server |
| `npm run dev` | Builds everything and starts the server |
| `npm run clean` | Removes all build artifacts |

## Author

**Eduardo J. Barrios**  
https://edujbarrios.com
