import { spawn } from "node:child_process";

import { runCommand } from "../command-runner.js";

type CommandRunner = (command: string, args: string[]) => string;

export function parseAndroidAvdList(avdListRaw: string): string[] {
  return avdListRaw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseRunningEmulatorSerials(adbDevicesOutput: string): string[] {
  return adbDevicesOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^emulator-\d+\s+device\b/.test(line))
    .map((line) => line.split(/\s+/)[0])
    .filter((serial): serial is string => typeof serial === "string" && serial.length > 0);
}

export function parseAvdNameFromAdbLine(line: string): string {
  const match = line.match(/\bavd:([^\s]+)/);
  return match?.[1] ?? "";
}

export function parseAvdNameFromEmulatorOutput(rawOutput: string): string {
  const line = rawOutput
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.length > 0 && item.toUpperCase() !== "OK");

  return line ?? "";
}

export function listBootedAndroidAvds(commandRunner: CommandRunner = runCommand): string[] {
  try {
    const devicesOutput = commandRunner("adb", ["devices", "-l"]);
    const deviceLines = devicesOutput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^emulator-\d+\s+device\b/.test(line));

    const directNames = deviceLines.map(parseAvdNameFromAdbLine).filter((name) => name.length > 0);
    const unresolvedSerials = deviceLines
      .filter((line) => parseAvdNameFromAdbLine(line).length === 0)
      .map((line) => line.split(/\s+/)[0])
      .filter((serial): serial is string => typeof serial === "string" && serial.length > 0);

    const serials = unresolvedSerials.length > 0 ? unresolvedSerials : parseRunningEmulatorSerials(devicesOutput);
    const avdNames: string[] = [];

    avdNames.push(...directNames);

    serials.forEach((serial) => {
      try {
        const nameOutput = commandRunner("adb", ["-s", serial, "emu", "avd", "name"]);
        const avdName = parseAvdNameFromEmulatorOutput(nameOutput);
        if (avdName.length > 0 && avdName.toLowerCase() !== "unknown") {
          avdNames.push(avdName);
        }
      } catch {
      }
    });

    return [...new Set(avdNames)];
  } catch {
    return [];
  }
}

export function listAndroidAvds(): string[] {
  const avdListRaw = runCommand("emulator", ["-list-avds"]);
  return parseAndroidAvdList(avdListRaw);
}

export function killAndroidEmulator(serial: string, commandRunner: CommandRunner = runCommand): void {
  commandRunner("adb", ["-s", serial, "emu", "kill"]);
}

export function launchAndroidEmulator(avdName: string): void {
  const process = spawn("emulator", ["-avd", avdName], {
    detached: true,
    stdio: "ignore"
  });
  process.unref();
}
