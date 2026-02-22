import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { formatBootedIosDevices, getActiveDevices, toDeviceStatus } from "./active.js";
import { listBootedAndroidAvds, parseAndroidAvdList, parseAvdNameFromEmulatorOutput, parseRunningEmulatorSerials } from "./android.js";
import { toIosSimulators } from "./ios.js";

describe("devices parsing", () => {
  test("parseAndroidAvdList trims empty lines", () => {
    const parsed = parseAndroidAvdList("\nPixel_8_API_35\n\nNexus_5X_API_28\n");
    assert.deepEqual(parsed, ["Pixel_8_API_35", "Nexus_5X_API_28"]);
  });

  test("toIosSimulators maps runtime prefix and keeps essential fields", () => {
    const simulators = toIosSimulators({
      devices: {
        "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [
          {
            udid: "abc",
            name: "iPhone 16",
            state: "Shutdown"
          }
        ]
      }
    });

    assert.deepEqual(simulators, [
      {
        udid: "abc",
        name: "iPhone 16",
        state: "Shutdown",
        runtime: "iOS-18-0"
      }
    ]);
  });

  test("toDeviceStatus falls back when output is empty", () => {
    assert.equal(toDeviceStatus("", "No devices"), "No devices");
    assert.equal(toDeviceStatus("booted", "No devices"), "booted");
  });

  test("formatBootedIosDevices returns inline runtime info", () => {
    const json = JSON.stringify({
      devices: {
        "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [
          {
            udid: "abc",
            name: "iPhone 16",
            state: "Booted"
          }
        ]
      }
    });

    assert.equal(formatBootedIosDevices(json), "iPhone 16 (iOS-18-0) - Booted");
  });

  test("parseRunningEmulatorSerials returns only emulator serials", () => {
    const output = [
      "List of devices attached",
      "emulator-5554 device product:sdk_gphone_x86_64",
      "R5CR30ABCDE device product:dm3q",
      "emulator-5556 offline"
    ].join("\n");

    assert.deepEqual(parseRunningEmulatorSerials(output), ["emulator-5554"]);
  });

  test("parseAvdNameFromEmulatorOutput handles trailing OK line", () => {
    assert.equal(parseAvdNameFromEmulatorOutput("Pixel_8_API_35\nOK\n"), "Pixel_8_API_35");
  });

  test("listBootedAndroidAvds resolves booted emulator names", () => {
    const commandRunner = (_command: string, args: string[]): string => {
      if (args[0] === "devices") {
        return [
          "List of devices attached",
          "emulator-5554 device product:sdk_gphone_x86_64",
          "emulator-5556 device product:sdk_gphone_x86_64"
        ].join("\n");
      }

      if (args[0] === "-s" && args[1] === "emulator-5554") {
        return "Pixel_8_API_35\nOK\n";
      }

      if (args[0] === "-s" && args[1] === "emulator-5556") {
        return "Pixel_7_API_34\nOK\n";
      }

      return "";
    };

    assert.deepEqual(listBootedAndroidAvds(commandRunner), ["Pixel_8_API_35", "Pixel_7_API_34"]);
  });
});

describe("active devices", () => {
  test("getActiveDevices returns parsed outputs when commands succeed", () => {
    const commandRunner = (command: string): string => {
      if (command === "xcrun") {
        return JSON.stringify({
          devices: {
            "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [
              {
                udid: "abc",
                name: "iPhone 16",
                state: "Booted"
              }
            ]
          }
        });
      }
      if (command === "adb") {
        return "emulator-5554 device";
      }
      return "";
    };

    assert.deepEqual(getActiveDevices(commandRunner), {
      ios: "iPhone 16 (iOS-18-0) - Booted",
      android: "emulator-5554 device"
    });
  });

  test("getActiveDevices falls back when command runner throws", () => {
    const failingRunner = (command: string): string => {
      throw new Error(`failed: ${command}`);
    };

    assert.deepEqual(getActiveDevices(failingRunner), {
      ios: "Unable to read iOS simulator state (xcrun not available).",
      android: "Unable to read Android device state (adb not available)."
    });
  });
});
