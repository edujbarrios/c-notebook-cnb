# C Notebook

## Description

C Notebook is a notebook environment for writing and running C code in reusable cells, then saving that work as `.cnb` notebooks.

It works by using a shared notebook format across two interfaces:

- **backend/**: terminal C notebook engine
- **frontend/**: web UI (Google Colab-like)

Both interfaces compile and execute C code with GCC and use the same notebook storage, so notebooks created in one interface can be opened in the other.

The repository root is intentionally split into these two top-level directories.

## Repository Structure

```
backend/    → C terminal backend, build files, memory, and saved notebooks
frontend/   → Web frontend (TypeScript + Express + static UI)
```

## Backend

### Requirements
- GCC
- Make

### Build

```bash
cd backend
make
```

### Run

```bash
cd backend
./cnb
```

### Terminal Commands
- `:save` → Save current notebook
- `:load` → Load default notebook
- `:exit` → Exit

Backend data paths:
- `backend/output_cnbs/` for saved `.cnb` notebooks
- `backend/memory/` for temporary compilation artifacts

## Frontend

### Requirements
- Node.js (v18+)
- GCC

### Setup & Run

```bash
cd frontend
npm install
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

The frontend API compiles C cells with GCC and stores notebooks in `backend/output_cnbs/`, sharing notebook data with the terminal backend.

## Run Both Interfaces

Use separate terminals:

```bash
# Terminal 1
cd frontend && npm start
```

```bash
# Terminal 2
cd backend && ./cnb
```

## Author

**Eduardo J. Barrios**  
https://edujbarrios.com
