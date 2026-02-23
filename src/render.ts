import { icons, mainMenuItems, paint } from "./constants.js";
import {
  appState,
  clampIndex,
  getCurrentFilterQuery,
  getVisibleAndroidAvdGroups,
  getVisibleAndroidAvds,
  getVisibleIosSimulatorGroups,
  getVisibleIosSimulators
} from "./state.js";

function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

function rule(char = "-"): string {
  const width = Math.max(process.stdout.columns ?? 80, 40);
  return char.repeat(Math.min(width - 2, 72));
}

function sectionTitle(label: string, summary = ""): void {
  const suffix = summary.length > 0 ? paint(` (${summary})`, "dim") : "";
  process.stdout.write(`${paint(label, "cyan")}${suffix}\n`);
  process.stdout.write(`${paint(rule(), "dim")}\n`);
}

function renderSelectableList(title: string, rows: string[], selectedIndex: number, hint: string, summary: string): void {
  sectionTitle(title, summary);
  rows.forEach((row, index) => {
    const marker = index === selectedIndex ? paint(">", "green") : paint("•", "dim");
    const rowText = index === selectedIndex ? paint(row, "green") : row;
    process.stdout.write(`${marker} ${rowText}\n`);
  });
  if (hint.trim().length > 0) {
    process.stdout.write(`\n${paint(hint, "dim")}\n`);
  }
}

function renderGroupedSelectableList(
  title: string,
  groups: Array<{ label: string; rows: string[] }>,
  selectedIndex: number,
  hint: string,
  summary: string
): void {
  sectionTitle(title, summary);
  let rowIndex = 0;

  groups.forEach((group) => {
    if (group.rows.length === 0) {
      return;
    }

    process.stdout.write(`${paint(group.label, "yellow")}\n`);
    group.rows.forEach((row) => {
      const selected = rowIndex === selectedIndex;
      const marker = selected ? paint(">", "green") : paint("•", "dim");
      const rowText = selected ? paint(row, "green") : row;
      process.stdout.write(`${marker} ${rowText}\n`);
      rowIndex += 1;
    });
    process.stdout.write("\n");
  });

  if (hint.trim().length > 0) {
    process.stdout.write(`${paint(hint, "dim")}\n`);
  }
}

function renderHeader(): void {
  process.stdout.write(`${paint(`${icons.menu} Mobile Device Simulator CLI`, "blue")}\n`);
  process.stdout.write(`${paint(rule(), "dim")}\n\n`);
}

function renderFooterStatus(): void {
  process.stdout.write("\n");

  if (appState.confirmKill) {
    if (appState.confirmKill.phase === "confirm") {
      process.stdout.write(
        `${paint("Confirm", "yellow")}: ${paint(appState.confirmKill.label, "cyan")} ${paint("(Enter to kill, Esc to cancel)", "dim")}\n`
      );
      process.stdout.write(
        `${paint("Keys", "dim")}: ${paint("Enter", "cyan")} confirm · ${paint("Esc", "cyan")} cancel · ${paint("Ctrl+C", "cyan")} quit\n`
      );
      return;
    }

    process.stdout.write(`${paint("Killing", "yellow")}: ${paint(appState.confirmKill.label, "cyan")} ${paint("(please wait)", "dim")}\n`);
    process.stdout.write(`${paint("Keys", "dim")}: ${paint("Ctrl+C", "cyan")} quit\n`);
    return;
  }

  if (appState.busy) {
    process.stdout.write(`${paint("Working...", "yellow")}\n`);
  }

  function segment(keyLabel: string, actionLabel: string, active: boolean): string {
    if (!active) {
      return paint(`${keyLabel} ${actionLabel}`, "dim");
    }
    return `${paint(keyLabel, "cyan")} ${actionLabel}`;
  }

  const keys: string[] = [];
  if (appState.screen === "main") {
    const actionItems = mainMenuItems.filter((item) => item.value !== "exit");
    const totalRows = actionItems.length + appState.activeIosBooted.length + appState.activeAndroidDeviceLines.length + 1;
    const selectionIndex = clampIndex(appState.mainIndex, totalRows);
    const inActions = selectionIndex < actionItems.length;
    const iosStart = actionItems.length;
    const iosEnd = iosStart + appState.activeIosBooted.length;
    const androidStart = iosEnd;
    const androidEnd = androidStart + appState.activeAndroidDeviceLines.length;
    const inActiveIos = selectionIndex >= iosStart && selectionIndex < iosEnd;
    const inActiveAndroid = selectionIndex >= androidStart && selectionIndex < androidEnd;
    const inExit = selectionIndex === totalRows - 1;

    const canMove = totalRows > 1;
    const canEnter = inActions || inExit;
    const serial = inActiveAndroid ? (appState.activeAndroidDeviceLines[selectionIndex - androidStart]?.split(/\s+/)[0] ?? "") : "";
    const canKill = inActiveIos || (inActiveAndroid && serial.startsWith("emulator-"));

    keys.push(segment("Up/Down", "move", canMove), segment("Enter", "select", canEnter), segment("k", "kill", canKill));
  }

  if (appState.screen === "ios" || appState.screen === "android") {
    const visibleCount = appState.screen === "ios" ? getVisibleIosSimulators().length : getVisibleAndroidAvds().length;
    const canMove = visibleCount > 1;
    const canEnter = visibleCount > 0;
    const canKill =
      appState.screen === "ios"
        ? (() => {
            const visible = getVisibleIosSimulators();
            const selected = visible[appState.iosIndex];
            return selected ? selected.state.toLowerCase() === "booted" : false;
          })()
        : false;

    keys.push(segment("Up/Down", "move", canMove), segment("Enter", "select", canEnter));
    if (appState.filterActive) {
      keys.push(segment("type", "filter", true), segment("Backspace", "erase/back", true), segment("Esc", "exit filter", true));
    } else {
      keys.push(segment("f", "filter mode", true), segment("Esc/Backspace", "back", true));
    }

    keys.push(segment("k", "kill", canKill));
  }

  keys.push(segment("Ctrl+C", "quit", true));

  process.stdout.write(`${paint("Keys", "dim")}: ${keys.join(" · ")}\n`);
}

export function render(): void {
  clearScreen();
  renderHeader();

  if (appState.screen === "main") {
    const actionItems = mainMenuItems.filter((item) => item.value !== "exit");
    const exitItem = mainMenuItems.find((item) => item.value === "exit");
    const iosRows = appState.activeIosBooted.map((device) => `${device.name} (${device.runtime}) - ${device.state}`);
    const androidRows = appState.activeAndroidDeviceLines;
    const totalRows = actionItems.length + iosRows.length + androidRows.length + 1;
    appState.mainIndex = clampIndex(appState.mainIndex, totalRows);

    sectionTitle("Main Menu", `${actionItems.length + 1} actions`);
    actionItems.forEach((item, index) => {
      const row = `${item.label} - ${item.description}`;
      const marker = index === appState.mainIndex ? paint(">", "green") : paint("•", "dim");
      const rowText = index === appState.mainIndex ? paint(row, "green") : row;
      process.stdout.write(`${marker} ${rowText}\n`);
    });

    process.stdout.write("\n");
    sectionTitle("Active Devices");

    process.stdout.write(`${paint(`${icons.ios} iOS`, "magenta")}\n`);
    if (iosRows.length === 0) {
      process.stdout.write(`${paint("No booted iOS simulators.", "dim")}\n`);
    } else {
      iosRows.forEach((row, offset) => {
        const index = actionItems.length + offset;
        const marker = index === appState.mainIndex ? paint(">", "green") : paint("•", "dim");
        const rowText = index === appState.mainIndex ? paint(row, "green") : row;
        process.stdout.write(`${marker} ${rowText}\n`);
      });
    }

    process.stdout.write("\n");
    process.stdout.write(`${paint(`${icons.android} Android`, "green")}\n`);
    if (androidRows.length === 0) {
      process.stdout.write(`${paint("No connected Android devices.", "dim")}\n`);
    } else {
      androidRows.forEach((row, offset) => {
        const index = actionItems.length + iosRows.length + offset;
        const marker = index === appState.mainIndex ? paint(">", "green") : paint("•", "dim");
        const rowText = index === appState.mainIndex ? paint(row, "green") : row;
        process.stdout.write(`${marker} ${rowText}\n`);
      });
    }

    process.stdout.write("\n");
    const exitRow = `${exitItem?.label ?? "Exit"} - ${exitItem?.description ?? "Close CLI"}`;
    const exitIndex = actionItems.length + iosRows.length + androidRows.length;
    const exitMarker = exitIndex === appState.mainIndex ? paint(">", "green") : paint("•", "dim");
    const exitText = exitIndex === appState.mainIndex ? paint(exitRow, "green") : exitRow;
    process.stdout.write(`${exitMarker} ${exitText}\n`);
  } else if (appState.screen === "ios") {
    const visibleIos = getVisibleIosSimulators();
    const iosGroups = getVisibleIosSimulatorGroups();
    const iosSummary =
      visibleIos.length === 0
        ? "0 visible"
        : `${visibleIos.length} visible${appState.filterActive ? ` | filter: ${getCurrentFilterQuery() || "(type)"}` : ""}`;
    if (visibleIos.length === 0) {
      renderSelectableList(
        `${icons.ios} iOS Simulators`,
        ["No iOS simulators match current filter."],
        appState.iosIndex,
        "Press Enter to boot selected simulator.",
        iosSummary
      );
    } else {
      renderGroupedSelectableList(
        `${icons.ios} iOS Simulators`,
        [
          {
            label: "Currently booted",
            rows: iosGroups.booted.map((device) => `${device.name} (${device.runtime}) - ${device.state}`)
          },
          {
            label: "Recently used",
            rows: iosGroups.recent.map((device) => `${device.name} (${device.runtime}) - ${device.state}`)
          },
          {
            label: iosGroups.booted.length > 0 || iosGroups.recent.length > 0 ? "Other devices" : "Available devices",
            rows: iosGroups.others.map((device) => `${device.name} (${device.runtime}) - ${device.state}`)
          }
        ],
        appState.iosIndex,
        "Press Enter to boot selected simulator.",
        iosSummary
      );
    }
  } else if (appState.screen === "android") {
    const visibleAndroid = getVisibleAndroidAvds();
    const androidGroups = getVisibleAndroidAvdGroups();
    const androidSummary =
      visibleAndroid.length === 0
        ? "0 visible"
        : `${visibleAndroid.length} visible${appState.filterActive ? ` | filter: ${getCurrentFilterQuery() || "(type)"}` : ""}`;
    if (visibleAndroid.length === 0) {
      renderSelectableList(
        `${icons.android} Android Emulators`,
        ["No Android emulators match current filter."],
        appState.androidIndex,
        "Press Enter to launch selected AVD.",
        androidSummary
      );
    } else {
      renderGroupedSelectableList(
        `${icons.android} Android Emulators`,
        [
          {
            label: "Currently booted",
            rows: androidGroups.booted
          },
          {
            label: "Recently used",
            rows: androidGroups.recent
          },
          {
            label: androidGroups.booted.length > 0 || androidGroups.recent.length > 0 ? "Other devices" : "Available devices",
            rows: androidGroups.others
          }
        ],
        appState.androidIndex,
        "Press Enter to launch selected AVD.",
        androidSummary
      );
    }
  }

  renderFooterStatus();
}
