import { io, Socket } from "socket.io-client";

// Execution status
export type ExecutionStatus =
  | "idle"
  | "connecting"
  | "running"
  | "completed"
  | "error"
  | "timeout";

// Execution request
export interface ExecutionRequest {
  code: string;
  language: "javascript" | "typescript" | "python" | "go" | "rust";
  roomId: string;
  timeout?: number;
}

// Execution result
export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number;
  error?: string;
}

// Output line for streaming
export interface OutputLine {
  type: "stdout" | "stderr" | "system";
  content: string;
  timestamp: number;
}

// Execution callbacks
export interface ExecutionCallbacks {
  onStatusChange?: (status: ExecutionStatus) => void;
  onOutput?: (line: OutputLine) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: string) => void;
}

class CodeExecutionService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private callbacks: ExecutionCallbacks = {};
  private currentExecution: string | null = null;

  constructor(
    serverUrl: string = import.meta.env.VITE_API_URL || "http://localhost:3001"
  ) {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to the execution server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.serverUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("🔌 Connected to execution server");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        console.log("🔌 Disconnected from execution server");
      });

      // Handle execution result
      this.socket.on("execution-result", (result: ExecutionResult) => {
        this.callbacks.onComplete?.(result);
        this.callbacks.onStatusChange?.(result.success ? "completed" : "error");
        this.currentExecution = null;
      });
    });
  }

  /**
   * Disconnect from the execution server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Set callbacks for execution events
   */
  setCallbacks(callbacks: ExecutionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Execute code
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.socket?.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected to execution server"));
        return;
      }

      this.currentExecution = `${request.roomId}-${Date.now()}`;
      this.callbacks.onStatusChange?.("running");

      // Add system output
      this.callbacks.onOutput?.({
        type: "system",
        content: `▶ Running ${request.language}...`,
        timestamp: Date.now(),
      });

      // Send execution request
      this.socket.emit("execute-code", request, (result: ExecutionResult) => {
        this.currentExecution = null;

        // Stream output
        if (result.stdout) {
          result.stdout.split("\n").forEach((line) => {
            this.callbacks.onOutput?.({
              type: "stdout",
              content: line,
              timestamp: Date.now(),
            });
          });
        }

        if (result.stderr) {
          result.stderr.split("\n").forEach((line) => {
            this.callbacks.onOutput?.({
              type: "stderr",
              content: line,
              timestamp: Date.now(),
            });
          });
        }

        // Add completion message
        this.callbacks.onOutput?.({
          type: "system",
          content: result.success
            ? `✓ Completed in ${result.executionTime}ms`
            : `✗ Failed (exit code: ${result.exitCode})`,
          timestamp: Date.now(),
        });

        this.callbacks.onStatusChange?.(result.success ? "completed" : "error");
        this.callbacks.onComplete?.(result);
        resolve(result);
      });

      // Handle timeout
      const timeout = request.timeout || 30000;
      setTimeout(() => {
        if (this.currentExecution) {
          this.callbacks.onStatusChange?.("timeout");
          this.callbacks.onError?.("Execution timed out");
          this.currentExecution = null;
          reject(new Error("Execution timed out"));
        }
      }, timeout + 5000); // Add buffer to server timeout
    });
  }

  /**
   * Stop current execution
   */
  stop(): void {
    if (this.currentExecution && this.socket) {
      // Note: Would need backend support for stopping execution
      this.callbacks.onOutput?.({
        type: "system",
        content: "⚠ Stop requested",
        timestamp: Date.now(),
      });
      this.currentExecution = null;
      this.callbacks.onStatusChange?.("idle");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.currentExecution !== null;
  }
}

// Singleton instance
export const codeExecutionService = new CodeExecutionService();

// Export supported languages
export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
] as const;

export default codeExecutionService;
