import { runCommand } from "../command-runner.js";
import type { ActiveDevices, SimctlDevicesResponse } from "../types.js";

const IOS_FALLBACK = "Unable to read iOS simulator state (xcrun not available).";
const ANDROID_FALLBACK = "Unable to read Android device state (adb not available).";
type CommandRunner = (command: string, args: string[]) => string;

export function toDeviceStatus(output: string, emptyMessage: string): string {
  return output.length > 0 ? output : emptyMessage;
}

export function formatBootedIosDevices(rawJson: string): string {
  const parsed = JSON.parse(rawJson) as SimctlDevicesResponse;

  const rows = Object.entries(parsed.devices).flatMap(([runtime, devices]) => {
    const runtimeName = runtime.replace("com.apple.CoreSimulator.SimRuntime.", "");
    return devices.map((device) => `${device.name} (${runtimeName}) - ${device.state}`);
  });

  if (rows.length === 0) {
    return "No booted iOS simulators.";
  }

  return rows.join("\n");
}

export function getActiveDevices(commandRunner: CommandRunner = runCommand): ActiveDevices {
  let ios = IOS_FALLBACK;
  let android = ANDROID_FALLBACK;

  try {
    const iosOutput = commandRunner("xcrun", ["simctl", "list", "devices", "booted", "--json"]);
    ios = formatBootedIosDevices(iosOutput);
  } catch {
    ios = IOS_FALLBACK;
  }

  try {
    const androidOutput = commandRunner("adb", ["devices", "-l"]);
    android = toDeviceStatus(androidOutput, "No connected Android devices.");
  } catch {
    android = ANDROID_FALLBACK;
  }

  return { ios, android };
}
