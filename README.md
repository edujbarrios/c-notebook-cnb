# C Notebook

## Description

C Notebook is a notebook environment for writing and running C code in reusable cells, then saving that work as `.cnb` notebooks.

It works by using a shared notebook format across two interfaces:

- **backend/**: terminal C notebook engine
- **frontend/**: web UI (Google Colab-like)

Both interfaces compile and execute C code with GCC and use the same notebook storage, so notebooks created in one interface can be opened in the other.

## Quick Start (All-in-One)

The fastest way to get up and running with both frontend and backend:

### Requirements
- GCC
- Make
- Node.js (v18+)

### Using npm

```bash
npm install   # installs frontend dependencies automatically
npm run build # builds the C backend and TypeScript frontend
npm start     # starts the web server at http://localhost:3000
```

Or do it all in one step:

```bash
npm install && npm run dev
```

### Using Make

```bash
make install  # installs frontend dependencies
make dev      # builds everything and starts the server
```

Open [http://localhost:3000](http://localhost:3000) to use the web notebook.

## Repository Structure

```
package.json   → Root orchestration scripts (all-in-one build & run)
Makefile       → Root Makefile for make-based workflow
backend/       → C terminal backend, build files, memory, and saved notebooks
frontend/      → Web frontend (TypeScript + Express + static UI)
```

## Backend (Terminal)

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

## Frontend (Web UI)

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
