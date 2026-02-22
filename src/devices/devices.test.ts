import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getActiveDevices, toDeviceStatus } from "./active.js";
import { parseAndroidAvdList } from "./android.js";
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
});

describe("active devices", () => {
  test("getActiveDevices returns parsed outputs when commands succeed", () => {
    const commandRunner = (command: string): string => {
      if (command === "xcrun") {
        return "iPhone 16 (Booted)";
      }
      if (command === "adb") {
        return "emulator-5554 device";
      }
      return "";
    };

    assert.deepEqual(getActiveDevices(commandRunner), {
      ios: "iPhone 16 (Booted)",
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
