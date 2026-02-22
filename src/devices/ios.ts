import { spawn } from "node:child_process";

import { runCommand } from "../command-runner.js";
import type { IosSimulator, SimctlDevicesResponse } from "../types.js";

export function listIosSimulators(): IosSimulator[] {
  const raw = runCommand("xcrun", ["simctl", "list", "devices", "available", "--json"]);
  const parsed = JSON.parse(raw) as SimctlDevicesResponse;

  return Object.entries(parsed.devices).flatMap(([runtime, devices]) =>
    devices.map((device) => ({
      udid: device.udid,
      name: device.name,
      state: device.state,
      runtime: runtime.replace("com.apple.CoreSimulator.SimRuntime.", "")
    }))
  );
}

export function launchIosSimulator(udid: string): void {
  runCommand("xcrun", ["simctl", "boot", udid]);
  const process = spawn("open", ["-a", "Simulator"], {
    detached: true,
    stdio: "ignore"
  });
  process.unref();
}
