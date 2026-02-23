import readline from "node:readline";

import { mainMenuItems } from "./constants.js";
import { getActiveDevicesSnapshot } from "./devices/active.js";
import { launchAndroidEmulator, listAndroidAvds, listBootedAndroidAvds } from "./devices/android.js";
import { killAndroidEmulator } from "./devices/android.js";
import { launchIosSimulator, listIosSimulators, shutdownIosSimulator } from "./devices/ios.js";
import { loadDeviceHistory, pushRecentAndroidAvdName, pushRecentIosUdid, saveDeviceHistory } from "./history.js";
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

function refreshActiveDevices(): void {
  const snapshot = getActiveDevicesSnapshot();
  appState.activeDevices = snapshot.activeDevices;
  appState.activeIosBooted = snapshot.iosSimulators;
  appState.activeAndroidDeviceLines = snapshot.androidDeviceLines;
}

type KillTarget = {
  platform: "ios" | "android";
  id: string;
  label: string;
};

function getMainSelection():
  | { kind: "action"; action: "launch-ios-simulator" | "launch-android-emulator" }
  | { kind: "active-ios"; udid: string; label: string }
  | { kind: "active-android"; serial: string; label: string }
  | { kind: "exit" } {
  const actionItems = mainMenuItems.filter((item) => item.value !== "exit");
  const exitIndex = actionItems.length + appState.activeIosBooted.length + appState.activeAndroidDeviceLines.length;

  if (appState.mainIndex < actionItems.length) {
    const selected = actionItems[appState.mainIndex];
    if (selected?.value === "launch-ios-simulator" || selected?.value === "launch-android-emulator") {
      return { kind: "action", action: selected.value };
    }
  }

  const iosStart = actionItems.length;
  const iosRows = appState.activeIosBooted;
  const iosEnd = iosStart + iosRows.length;
  if (appState.mainIndex >= iosStart && appState.mainIndex < iosEnd) {
    const selected = iosRows[appState.mainIndex - iosStart];
    if (selected) {
      return {
        kind: "active-ios",
        udid: selected.udid,
        label: `${selected.name} (${selected.runtime}) - ${selected.state}`
      };
    }
  }

  const androidStart = iosEnd;
  const androidRows = appState.activeAndroidDeviceLines;
  const androidEnd = androidStart + androidRows.length;
  if (appState.mainIndex >= androidStart && appState.mainIndex < androidEnd) {
    const line = androidRows[appState.mainIndex - androidStart] ?? "";
    const serial = line.split(/\s+/)[0] ?? "";
    return { kind: "active-android", serial, label: line };
  }

  if (appState.mainIndex === exitIndex) {
    return { kind: "exit" };
  }

  return { kind: "action", action: "launch-ios-simulator" };
}

function getMainSelectableCount(): number {
  const actionItems = mainMenuItems.filter((item) => item.value !== "exit");
  return actionItems.length + appState.activeIosBooted.length + appState.activeAndroidDeviceLines.length + 1;
}

function getKillTarget(): KillTarget | null {
  if (appState.screen === "main") {
    const selection = getMainSelection();
    if (selection.kind === "active-ios") {
      return { platform: "ios", id: selection.udid, label: selection.label };
    }
    if (selection.kind === "active-android") {
      if (selection.serial.startsWith("emulator-")) {
        return { platform: "android", id: selection.serial, label: selection.serial };
      }
    }
    return null;
  }

  if (appState.screen === "ios") {
    const visibleIos = getVisibleIosSimulators();
    const selectedDevice = visibleIos[appState.iosIndex];
    if (selectedDevice && selectedDevice.state.toLowerCase() === "booted") {
      return {
        platform: "ios",
        id: selectedDevice.udid,
        label: `${selectedDevice.name} (${selectedDevice.runtime}) - ${selectedDevice.state}`
      };
    }
  }

  return null;
}

function confirmKill(target: KillTarget): void {
  appState.confirmKill = { platform: target.platform, id: target.id, label: target.label, phase: "confirm" };
}

function executeKillConfirmed(): void {
  const target = appState.confirmKill;
  if (!target || target.phase !== "confirm") {
    return;
  }

  appState.confirmKill = { ...target, phase: "running" };

  runBusyAction(() => {
    if (target.platform === "ios") {
      shutdownIosSimulator(target.id);
    } else {
      killAndroidEmulator(target.id);
    }
    refreshActiveDevices();
  });

  appState.confirmKill = null;
}

function moveSelection(step: number): void {
  if (appState.screen === "main") {
    appState.mainIndex = clampIndex(appState.mainIndex + step, getMainSelectableCount());
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
  }
}

function persistRecentHistory(): void {
  saveDeviceHistory({
    recentIosUdids: appState.recentIosUdids,
    recentAndroidAvdNames: appState.recentAndroidAvdNames
  });
}

function handleEnter(): void {
  if (appState.confirmKill) {
    executeKillConfirmed();
    return;
  }

  if (appState.screen === "main") {
    const selection = getMainSelection();

    if (selection.kind === "action" && selection.action === "launch-ios-simulator") {
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

    if (selection.kind === "action" && selection.action === "launch-android-emulator") {
      runBusyAction(() => {
        const avds = listAndroidAvds();
        if (avds.length === 0) {
          backToMainMenu("No Android Virtual Devices found.");
          return;
        }
        appState.androidAvds = avds;
        appState.bootedAndroidAvdNames = listBootedAndroidAvds();
        appState.androidIndex = 0;
        appState.androidFilterQuery = "";
        appState.filterActive = false;
        appState.screen = "android";
        appState.statusMessage = "Select an Android AVD to launch.";
      });
      return;
    }

    if (selection.kind === "active-ios" || selection.kind === "active-android") {
      return;
    }

    if (selection.kind === "exit") {
      cleanupAndExit(0);
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
      appState.recentIosUdids = pushRecentIosUdid(selectedDevice.udid, appState.recentIosUdids);
      persistRecentHistory();
      refreshActiveDevices();
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
      appState.recentAndroidAvdNames = pushRecentAndroidAvdName(selectedAvd, appState.recentAndroidAvdNames);
      persistRecentHistory();
      refreshActiveDevices();
      backToMainMenu(`Android emulator launch requested for ${selectedAvd}.`);
    });
  }
}

function handleBack(): void {
  if (appState.confirmKill) {
    appState.confirmKill = null;
    return;
  }

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
      return true;
    }
    return false;
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
  const history = loadDeviceHistory();
  appState.recentIosUdids = history.recentIosUdids;
  appState.recentAndroidAvdNames = history.recentAndroidAvdNames;
  process.stdin.setRawMode(true);
  process.stdout.write("\x1b[?25l");

  runBusyAction(() => {
    refreshActiveDevices();
  });
  render();

  process.stdin.on("keypress", (input: string | undefined, key: readline.Key) => {
    if (key.ctrl && key.name === "c") {
      cleanupAndExit(0);
      return;
    }

    if (appState.confirmKill) {
      if (appState.confirmKill.phase === "confirm") {
        if (key.name === "escape" || key.name === "backspace") {
          appState.confirmKill = null;
          render();
          return;
        }
        if (key.name === "return") {
          executeKillConfirmed();
          render();
          return;
        }
      }

      return;
    }

    if (key.name === "k") {
      const target = getKillTarget();
      if (target) {
        confirmKill(target);
        render();
      }
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
