.PHONY: all install build backend frontend start dev clean

# Default: install dependencies, build everything, and start the server
all: install build

# Install frontend dependencies
install:
	cd frontend && npm install

# Build both backend and frontend
build: backend frontend

# Compile the C terminal backend
backend:
	cd backend && make

# Compile the TypeScript frontend
frontend:
	cd frontend && npm run build

# Start the web server (frontend + C compilation engine)
start:
	node frontend/dist/server.js

# Build everything and start
dev: build start

# Remove build artifacts
clean:
	cd backend && make clean
	cd frontend && rm -rf dist
