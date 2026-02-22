import { runCommand } from "../command-runner.js";
import type { ActiveDevices } from "../types.js";

const IOS_FALLBACK = "Unable to read iOS simulator state (xcrun not available).";
const ANDROID_FALLBACK = "Unable to read Android device state (adb not available).";

export function getActiveDevices(): ActiveDevices {
  let ios = IOS_FALLBACK;
  let android = ANDROID_FALLBACK;

  try {
    const iosOutput = runCommand("xcrun", ["simctl", "list", "devices", "booted"]);
    ios = iosOutput.length > 0 ? iosOutput : "No booted iOS simulators.";
  } catch {
    ios = IOS_FALLBACK;
  }

  try {
    const androidOutput = runCommand("adb", ["devices", "-l"]);
    android = androidOutput.length > 0 ? androidOutput : "No connected Android devices.";
  } catch {
    android = ANDROID_FALLBACK;
  }

  return { ios, android };
}
