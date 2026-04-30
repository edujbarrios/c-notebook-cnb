import { execFile } from "child_process";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const MEMORY_DIR = path.resolve(__dirname, "../../backend/memory");

export interface CompilationResult {
  success: boolean;
  output: string;
}

/**
 * Compiles and runs concatenated C code from all cells up to the given index.
 * Mirrors the behaviour of the original C backend's run_cell().
 *
 * Each invocation uses a unique pair of temp files so concurrent requests
 * (e.g. two cells running at the same time) never clobber each other.
 */
export async function compileAndRun(
  cellsCodes: string[],
  upToIndex: number
): Promise<CompilationResult> {
  if (upToIndex < 0 || upToIndex >= cellsCodes.length) {
    return { success: false, output: "Invalid cell index" };
  }

  fs.mkdirSync(MEMORY_DIR, { recursive: true });

  // Unique suffix so concurrent compilations don't share files
  const uid = randomUUID();
  const tempC = path.join(MEMORY_DIR, `temp_${uid}.c`);
  const tempOut = path.join(MEMORY_DIR, `temp_${uid}.out`);

  // Build a single C source that wraps every cell inside main()
  const lines: string[] = [
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <string.h>",
    "#include <math.h>",
    "int main() {",
  ];
  for (let i = 0; i <= upToIndex; i++) {
    lines.push(cellsCodes[i]);
  }
  lines.push("return 0; }");

  fs.writeFileSync(tempC, lines.join("\n"), "utf-8");

  try {
    // Compile
    try {
      await runCommand("gcc", [tempC, "-o", tempOut, "-lm"]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unknown compilation error";
      return { success: false, output: msg };
    }

    // Execute
    try {
      const stdout = await runCommand(tempOut, [], 10_000);
      return { success: true, output: stdout };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unknown execution error";
      return { success: false, output: msg };
    }
  } finally {
    // Always clean up, regardless of compilation or execution outcome
    cleanupTempFiles(tempC, tempOut);
  }
}

/**
 * Remove temporary compilation artifacts from the memory directory.
 */
function cleanupTempFiles(tempC: string, tempOut: string): void {
  try {
    if (fs.existsSync(tempC)) fs.unlinkSync(tempC);
    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
  } catch {
    // Best-effort cleanup; ignore errors
  }
}

/**
 * Execute a command as a child process with a timeout.
 * @param cmd   - Absolute path or name of the executable to run.
 * @param args  - Array of command-line arguments.
 * @param timeoutMs - Maximum wall-clock time (ms) before the process is killed.
 * @returns Combined stdout and stderr as a single string.
 */
function runCommand(
  cmd: string,
  args: string[],
  timeoutMs = 30_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || "") + (stdout || "") + (error.message || "")));
        } else {
          resolve(stdout + stderr);
        }
      }
    );
  });
}
