import { spawn } from "node:child_process";

import { runCommand } from "../command-runner.js";

export function listAndroidAvds(): string[] {
  const avdListRaw = runCommand("emulator", ["-list-avds"]);
  return avdListRaw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function launchAndroidEmulator(avdName: string): void {
  const process = spawn("emulator", ["-avd", avdName], {
    detached: true,
    stdio: "ignore"
  });
  process.unref();
}
