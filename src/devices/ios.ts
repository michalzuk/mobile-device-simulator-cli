import { spawn } from "node:child_process";

import { runCommand } from "../command-runner.js";
import type { IosSimulator, SimctlDevicesResponse } from "../types.js";

function parseSimctlDevicesJson(raw: string, context: string): SimctlDevicesResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${context}: failed to parse JSON output (${error instanceof Error ? error.message : String(error)})`
    );
  }

  if (!parsed || typeof parsed !== "object" || !("devices" in parsed)) {
    throw new Error(`${context}: invalid simctl JSON output (missing devices map)`);
  }

  return parsed as SimctlDevicesResponse;
}

export function toIosSimulators(parsed: SimctlDevicesResponse): IosSimulator[] {
  return Object.entries(parsed.devices).flatMap(([runtime, devices]) =>
    devices.map((device) => ({
      udid: device.udid,
      name: device.name,
      state: device.state,
      runtime: runtime.replace("com.apple.CoreSimulator.SimRuntime.", "")
    }))
  );
}

export function listIosSimulators(): IosSimulator[] {
  const raw = runCommand("xcrun", ["simctl", "list", "devices", "available", "--json"]);
  const parsed = parseSimctlDevicesJson(raw, "Unable to read iOS simulators");
  return toIosSimulators(parsed);
}

export function launchIosSimulator(udid: string): void {
  runCommand("xcrun", ["simctl", "boot", udid]);
  const process = spawn("open", ["-a", "Simulator"], {
    detached: true,
    stdio: "ignore"
  });
  process.unref();
}

export function shutdownIosSimulator(udid: string): void {
  runCommand("xcrun", ["simctl", "shutdown", udid]);
}
