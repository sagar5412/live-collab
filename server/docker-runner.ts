import { spawn, ChildProcess } from "child_process";
import {
  ExecutionRequest,
  ExecutionResult,
  LANGUAGE_CONFIGS,
  DockerConfig,
} from "./types";

/**
 * Execute code in a sandboxed Docker container
 */
export async function executeCode(
  request: ExecutionRequest
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const config = LANGUAGE_CONFIGS[request.language];
  const timeout = request.timeout || config.timeout;

  // Check if Docker is available
  const dockerAvailable = await checkDockerAvailable();
  if (!dockerAvailable) {
    return {
      success: false,
      stdout: "",
      stderr:
        "Docker is not available. Please install Docker to enable code execution.",
      exitCode: 1,
      executionTime: Date.now() - startTime,
      error: "DOCKER_NOT_AVAILABLE",
    };
  }

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let killed = false;
    let process: ChildProcess | null = null;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      killed = true;
      if (process) {
        process.kill("SIGKILL");
      }
      resolve({
        success: false,
        stdout,
        stderr: stderr + "\nExecution timed out",
        exitCode: null,
        executionTime: timeout,
        error: "TIMEOUT",
      });
    }, timeout);

    try {
      // Build Docker command
      const dockerArgs = buildDockerArgs(
        config,
        request.code,
        request.language
      );

      process = spawn("docker", dockerArgs);

      process.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
        // Limit output size
        if (stdout.length > 100000) {
          stdout = stdout.substring(0, 100000) + "\n... (output truncated)";
          process?.kill("SIGKILL");
        }
      });

      process.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
        if (stderr.length > 100000) {
          stderr = stderr.substring(0, 100000) + "\n... (output truncated)";
          process?.kill("SIGKILL");
        }
      });

      process.on("close", (exitCode) => {
        clearTimeout(timeoutId);
        if (!killed) {
          resolve({
            success: exitCode === 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode,
            executionTime: Date.now() - startTime,
          });
        }
      });

      process.on("error", (error) => {
        clearTimeout(timeoutId);
        if (!killed) {
          resolve({
            success: false,
            stdout: "",
            stderr: error.message,
            exitCode: null,
            executionTime: Date.now() - startTime,
            error: "SPAWN_ERROR",
          });
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error",
        exitCode: null,
        executionTime: Date.now() - startTime,
        error: "EXECUTION_ERROR",
      });
    }
  });
}

/**
 * Build Docker run arguments
 */
function buildDockerArgs(
  config: DockerConfig,
  code: string,
  language: string
): string[] {
  const args = [
    "run",
    "--rm", // Remove container after execution
    "--network=none", // Disable network access
    `--memory=${config.memoryLimit}`,
    `--cpus=${config.cpuLimit}`,
    "--pids-limit=50", // Limit processes
    "--read-only", // Read-only filesystem
    "--tmpfs=/tmp:rw,size=64m", // Writable /tmp
    "--security-opt=no-new-privileges", // Prevent privilege escalation
  ];

  // Escape code for shell safety using base64
  const base64 = Buffer.from(code).toString("base64");

  // All languages need --entrypoint to override the Node entrypoint in the image
  // Then use sh -c wrapper for base64 decoding and execution
  if (language === "javascript") {
    args.push("--entrypoint", "/bin/sh");
    args.push(config.image);
    args.push("-c", `echo '${base64}' | base64 -d | node`);
  } else if (language === "python") {
    args.push("--entrypoint", "/bin/sh");
    args.push(config.image);
    args.push("-c", `echo '${base64}' | base64 -d | python`);
  } else if (language === "typescript") {
    // TypeScript needs special handling - write to file first
    args.push("--entrypoint", "/bin/sh");
    args.push(config.image);
    args.push(
      "-c",
      `echo '${base64}' | base64 -d > /tmp/code.ts && npx tsx /tmp/code.ts`
    );
  } else if (language === "go") {
    args.push("--entrypoint", "/bin/sh");
    args.push(config.image);
    args.push(
      "-c",
      `echo '${base64}' | base64 -d > /tmp/main.go && go run /tmp/main.go`
    );
  } else if (language === "rust") {
    args.push("--entrypoint", "/bin/sh");
    args.push(config.image);
    args.push(
      "-c",
      `echo '${base64}' | base64 -d > /tmp/main.rs && rustc --edition=2021 -o /tmp/out /tmp/main.rs && /tmp/out`
    );
  }

  return args;
}

/**
 * Escape string for shell argument
 */
function escapeShellArg(arg: string): string {
  // Use base64 encoding to safely pass code
  const base64 = Buffer.from(arg).toString("base64");
  return `"$(echo '${base64}' | base64 -d)"`;
}

/**
 * Check if Docker is available
 */
async function checkDockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn("docker", ["version"]);
    process.on("close", (code) => {
      resolve(code === 0);
    });
    process.on("error", () => {
      resolve(false);
    });
  });
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_CONFIGS);
}
