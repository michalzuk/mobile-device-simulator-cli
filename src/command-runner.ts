import { execFileSync } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BUFFER_BYTES = 5 * 1024 * 1024;

type RunCommandOptions = {
  timeoutMs?: number;
  maxBufferBytes?: number;
};

export function runCommand(command: string, args: string[], options: RunCommandOptions = {}): string {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES,
    windowsHide: true
  }).trim();
}
