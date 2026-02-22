import { runCommand } from "../command-runner.js";
import type { ActiveDevices } from "../types.js";

const IOS_FALLBACK = "Unable to read iOS simulator state (xcrun not available).";
const ANDROID_FALLBACK = "Unable to read Android device state (adb not available).";
type CommandRunner = (command: string, args: string[]) => string;

export function toDeviceStatus(output: string, emptyMessage: string): string {
  return output.length > 0 ? output : emptyMessage;
}

export function getActiveDevices(commandRunner: CommandRunner = runCommand): ActiveDevices {
  let ios = IOS_FALLBACK;
  let android = ANDROID_FALLBACK;

  try {
    const iosOutput = commandRunner("xcrun", ["simctl", "list", "devices", "booted"]);
    ios = toDeviceStatus(iosOutput, "No booted iOS simulators.");
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
