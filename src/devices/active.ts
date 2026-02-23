import { runCommand } from "../command-runner.js";
import type { ActiveDevices, IosSimulator, SimctlDevicesResponse } from "../types.js";

const IOS_FALLBACK = "Unable to read iOS simulator state (xcrun not available).";
const ANDROID_FALLBACK = "Unable to read Android device state (adb not available).";
type CommandRunner = (command: string, args: string[]) => string;

export function toDeviceStatus(output: string, emptyMessage: string): string {
  return output.length > 0 ? output : emptyMessage;
}

export function formatBootedIosDevices(rawJson: string): string {
  const simulators = parseBootedIosSimulators(rawJson);
  if (simulators.length === 0) {
    return "No booted iOS simulators.";
  }
  return simulators.map((device) => `${device.name} (${device.runtime}) - ${device.state}`).join("\n");
}

export function parseBootedIosSimulators(rawJson: string): IosSimulator[] {
  const parsed = JSON.parse(rawJson) as SimctlDevicesResponse;

  return Object.entries(parsed.devices).flatMap(([runtime, devices]) => {
    const runtimeName = runtime.replace("com.apple.CoreSimulator.SimRuntime.", "");
    return devices.map((device) => ({
      udid: device.udid,
      name: device.name,
      state: device.state,
      runtime: runtimeName
    }));
  });
}

export function parseAndroidDeviceLines(adbDevicesOutput: string): string[] {
  const trimmed = adbDevicesOutput.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const withoutHeader = lines[0]?.startsWith("List of devices") ? lines.slice(1) : lines;
  return withoutHeader.filter((line) => {
    const parts = line.split(/\s+/);
    return parts[1] === "device";
  });
}

export type ActiveDevicesSnapshot = {
  activeDevices: ActiveDevices;
  iosSimulators: IosSimulator[];
  androidDeviceLines: string[];
};

export function getActiveDevicesSnapshot(commandRunner: CommandRunner = runCommand): ActiveDevicesSnapshot {
  let ios = IOS_FALLBACK;
  let android = ANDROID_FALLBACK;
  let iosSimulators: IosSimulator[] = [];
  let androidDeviceLines: string[] = [];

  try {
    const iosOutput = commandRunner("xcrun", ["simctl", "list", "devices", "booted", "--json"]);
    iosSimulators = parseBootedIosSimulators(iosOutput);
    ios = iosSimulators.length === 0 ? "No booted iOS simulators." : iosSimulators.map((device) => `${device.name} (${device.runtime}) - ${device.state}`).join("\n");
  } catch {
    ios = IOS_FALLBACK;
    iosSimulators = [];
  }

  try {
    const androidOutput = commandRunner("adb", ["devices", "-l"]);
    android = toDeviceStatus(androidOutput, "No connected Android devices.");
    androidDeviceLines = parseAndroidDeviceLines(androidOutput);
  } catch {
    android = ANDROID_FALLBACK;
    androidDeviceLines = [];
  }

  return {
    activeDevices: { ios, android },
    iosSimulators,
    androidDeviceLines
  };
}

export function getActiveDevices(commandRunner: CommandRunner = runCommand): ActiveDevices {
  return getActiveDevicesSnapshot(commandRunner).activeDevices;
}
