import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";

const MEMORY_DIR = path.resolve(__dirname, "../../memory");
const TEMP_C = path.join(MEMORY_DIR, "temp.c");
const TEMP_OUT = path.join(MEMORY_DIR, "temp.out");
const OUTPUT_TXT = path.join(MEMORY_DIR, "memory_output.txt");

export interface CompilationResult {
  success: boolean;
  output: string;
}

/**
 * Compiles and runs concatenated C code from all cells up to the given index.
 * Mirrors the behaviour of the original C backend's run_cell().
 */
export async function compileAndRun(
  cellsCodes: string[],
  upToIndex: number
): Promise<CompilationResult> {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });

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

  fs.writeFileSync(TEMP_C, lines.join("\n"), "utf-8");

  // Compile
  try {
    await exec("gcc", [TEMP_C, "-o", TEMP_OUT, "-lm"]);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Unknown compilation error";
    return { success: false, output: msg };
  }

  // Execute
  try {
    const stdout = await exec(TEMP_OUT, [], 10_000);
    return { success: true, output: stdout };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Unknown execution error";
    return { success: false, output: msg };
  }
}

/**
 * Execute a command as a child process with a timeout.
 * @param cmd   - Absolute path or name of the executable to run.
 * @param args  - Array of command-line arguments.
 * @param timeoutMs - Maximum wall-clock time (ms) before the process is killed.
 * @returns Combined stdout and stderr as a single string.
 */
function exec(
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
