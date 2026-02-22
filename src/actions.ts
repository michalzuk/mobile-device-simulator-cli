import readline from "node:readline";

import { mainMenuItems } from "./constants.js";
import { getActiveDevices } from "./devices/active.js";
import { launchAndroidEmulator, listAndroidAvds } from "./devices/android.js";
import { launchIosSimulator, listIosSimulators } from "./devices/ios.js";
import { render } from "./render.js";
import {
  appState,
  backToMainMenu,
  clampIndex,
  getCurrentFilterQuery,
  getVisibleAndroidAvds,
  getVisibleIosSimulators,
  normalizeSelection,
  setCurrentFilterQuery
} from "./state.js";

function moveSelection(step: number): void {
  if (appState.screen === "main") {
    appState.mainIndex = clampIndex(appState.mainIndex + step, mainMenuItems.length);
  } else if (appState.screen === "ios") {
    const visible = getVisibleIosSimulators();
    appState.iosIndex = clampIndex(appState.iosIndex + step, visible.length);
  } else if (appState.screen === "android") {
    const visible = getVisibleAndroidAvds();
    appState.androidIndex = clampIndex(appState.androidIndex + step, visible.length);
  }
}

function runBusyAction(action: () => void): void {
  appState.busy = true;
  render();
  try {
    action();
  } catch (error) {
    backToMainMenu(error instanceof Error ? error.message : String(error));
  } finally {
    appState.busy = false;
    render();
  }
}

function handleEnter(): void {
  if (appState.screen === "main") {
    const selected = mainMenuItems[appState.mainIndex];

    if (selected.value === "launch-ios-simulator") {
      runBusyAction(() => {
        const simulators = listIosSimulators();
        if (simulators.length === 0) {
          backToMainMenu("No available iOS simulators found.");
          return;
        }
        appState.iosSimulators = simulators;
        appState.iosIndex = 0;
        appState.iosFilterQuery = "";
        appState.filterActive = false;
        appState.screen = "ios";
        appState.statusMessage = "Select an iOS simulator to boot.";
      });
      return;
    }

    if (selected.value === "launch-android-emulator") {
      runBusyAction(() => {
        const avds = listAndroidAvds();
        if (avds.length === 0) {
          backToMainMenu("No Android Virtual Devices found.");
          return;
        }
        appState.androidAvds = avds;
        appState.androidIndex = 0;
        appState.androidFilterQuery = "";
        appState.filterActive = false;
        appState.screen = "android";
        appState.statusMessage = "Select an Android AVD to launch.";
      });
      return;
    }

    if (selected.value === "active-devices") {
      runBusyAction(() => {
        appState.activeDevices = getActiveDevices();
        appState.screen = "devices";
        appState.statusMessage = "Showing currently active devices.";
      });
      return;
    }

    cleanupAndExit(0);
    return;
  }

  if (appState.screen === "ios" && appState.iosSimulators.length > 0) {
    const visibleIos = getVisibleIosSimulators();
    if (visibleIos.length === 0) {
      appState.statusMessage = "No iOS simulators match the filter.";
      return;
    }

    const selectedDevice = visibleIos[appState.iosIndex];
    if (!selectedDevice) {
      appState.statusMessage = "No iOS simulator selected.";
      return;
    }

    runBusyAction(() => {
      launchIosSimulator(selectedDevice.udid);
      backToMainMenu(`iOS Simulator launch requested for ${selectedDevice.name}.`);
    });
    return;
  }

  if (appState.screen === "android" && appState.androidAvds.length > 0) {
    const visibleAndroid = getVisibleAndroidAvds();
    if (visibleAndroid.length === 0) {
      appState.statusMessage = "No Android emulators match the filter.";
      return;
    }

    const selectedAvd = visibleAndroid[appState.androidIndex];
    if (!selectedAvd) {
      appState.statusMessage = "No Android emulator selected.";
      return;
    }

    runBusyAction(() => {
      launchAndroidEmulator(selectedAvd);
      backToMainMenu(`Android emulator launch requested for ${selectedAvd}.`);
    });
  }
}

function handleBack(): void {
  if (appState.filterActive && (appState.screen === "ios" || appState.screen === "android")) {
    appState.filterActive = false;
    setCurrentFilterQuery("");
    normalizeSelection();
    appState.statusMessage = "Filter cleared.";
    return;
  }

  if (appState.screen !== "main") {
    backToMainMenu("Returned to main menu.");
  }
}

function handleFilterToggle(): void {
  if (appState.screen !== "ios" && appState.screen !== "android") {
    return;
  }

  appState.filterActive = !appState.filterActive;
  if (appState.filterActive) {
    setCurrentFilterQuery("");
    appState.statusMessage = "Filter mode active. Type to filter, Backspace removes, Esc exits filter.";
  } else {
    setCurrentFilterQuery("");
    appState.statusMessage = "Filter mode disabled.";
  }

  normalizeSelection();
}

function handleFilterInput(input: string | undefined, key: readline.Key): boolean {
  if (!appState.filterActive || (appState.screen !== "ios" && appState.screen !== "android")) {
    return false;
  }

  if (key.name === "backspace") {
    const query = getCurrentFilterQuery();
    if (query.length > 0) {
      setCurrentFilterQuery(query.slice(0, -1));
      normalizeSelection();
    }
    return true;
  }

  if (key.name === "escape") {
    appState.filterActive = false;
    appState.statusMessage = "Filter mode disabled.";
    return true;
  }

  if (typeof input === "string" && input.length === 1 && !key.ctrl && !key.meta) {
    setCurrentFilterQuery(`${getCurrentFilterQuery()}${input}`);
    normalizeSelection();
    return true;
  }

  return false;
}

function cleanupAndExit(exitCode: number): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdout.write("\x1b[?25h");
  process.stdout.write("\n");
  process.exit(exitCode);
}

export function startCli(): void {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("This CLI requires an interactive terminal.");
    process.exit(1);
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdout.write("\x1b[?25l");

  process.stdin.on("keypress", (input: string | undefined, key: readline.Key) => {
    if (key.ctrl && key.name === "c") {
      cleanupAndExit(0);
      return;
    }

    if (key.name === "q") {
      cleanupAndExit(0);
      return;
    }

    if (key.name === "f") {
      handleFilterToggle();
      render();
      return;
    }

    if (handleFilterInput(input, key)) {
      render();
      return;
    }

    if (key.name === "up") {
      moveSelection(-1);
      render();
      return;
    }

    if (key.name === "down") {
      moveSelection(1);
      render();
      return;
    }

    if (key.name === "return") {
      handleEnter();
      render();
      return;
    }

    if (key.name === "escape" || key.name === "backspace") {
      handleBack();
      render();
    }
  });

  render();
}
