import { useState, useEffect, useCallback, useRef } from "react";
import { useCollaboration } from "./useCollaboration";
import {
  codeExecutionService,
  type ExecutionStatus,
  type ExecutionResult,
  type OutputLine,
  SUPPORTED_LANGUAGES,
} from "@/services/code-execution";

interface UseCodeExecutionReturn {
  status: ExecutionStatus;
  output: OutputLine[];
  lastResult: ExecutionResult | null;
  isRunning: boolean;
  execute: (code: string, language: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
  supportedLanguages: readonly string[];
}

/**
 * Hook for managing code execution state
 */
export function useCodeExecution(): UseCodeExecutionReturn {
  const { roomState } = useCollaboration();
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const isConnectedRef = useRef(false);

  // Connect to execution service on mount
  useEffect(() => {
    if (!isConnectedRef.current) {
      codeExecutionService
        .connect()
        .then(() => {
          isConnectedRef.current = true;
        })
        .catch((error) => {
          console.error("Failed to connect to execution service:", error);
        });
    }

    // Set up callbacks
    codeExecutionService.setCallbacks({
      onStatusChange: setStatus,
      onOutput: (line) => setOutput((prev) => [...prev, line]),
      onComplete: setLastResult,
      onError: (error) => {
        setOutput((prev) => [
          ...prev,
          { type: "stderr", content: error, timestamp: Date.now() },
        ]);
      },
    });

    return () => {
      // Note: Don't disconnect on unmount to allow background execution
    };
  }, []);

  // Execute code
  const execute = useCallback(
    async (code: string, language: string) => {
      if (!roomState.roomId) {
        setOutput((prev) => [
          ...prev,
          {
            type: "stderr",
            content: "Not connected to a room",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // Validate language
      if (
        !SUPPORTED_LANGUAGES.includes(
          language as (typeof SUPPORTED_LANGUAGES)[number]
        )
      ) {
        setOutput((prev) => [
          ...prev,
          {
            type: "stderr",
            content: `Unsupported language: ${language}`,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      try {
        await codeExecutionService.execute({
          code,
          language: language as (typeof SUPPORTED_LANGUAGES)[number],
          roomId: roomState.roomId,
        });
      } catch (error) {
        console.error("Execution error:", error);
      }
    },
    [roomState.roomId]
  );

  // Stop execution
  const stop = useCallback(() => {
    codeExecutionService.stop();
  }, []);

  // Clear output
  const clear = useCallback(() => {
    setOutput([]);
    setLastResult(null);
    setStatus("idle");
  }, []);

  return {
    status,
    output,
    lastResult,
    isRunning: status === "running",
    execute,
    stop,
    clear,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
