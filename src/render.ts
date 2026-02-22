import { icons, mainMenuItems, paint } from "./constants.js";
import { appState, getCurrentFilterQuery, getVisibleAndroidAvds, getVisibleIosSimulators } from "./state.js";

function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

function renderSelectableList(title: string, rows: string[], selectedIndex: number, hint: string): void {
  process.stdout.write(`${paint(title, "cyan")}\n\n`);
  rows.forEach((row, index) => {
    const marker = index === selectedIndex ? paint(">", "green") : paint(" ", "dim");
    const rowText = index === selectedIndex ? paint(row, "green") : row;
    process.stdout.write(`${marker} ${rowText}\n`);
  });
  process.stdout.write(`\n${paint(hint, "dim")}\n`);
}

export function render(): void {
  clearScreen();
  process.stdout.write(`${paint(`${icons.menu} Mobile Device Simulator CLI`, "blue")}\n`);
  process.stdout.write(`${paint("================================", "dim")}\n\n`);

  if (appState.screen === "main") {
    renderSelectableList(
      "Main menu",
      mainMenuItems.map((item) => `${item.label} - ${item.description}`),
      appState.mainIndex,
      "Use Up/Down + Enter. Esc/Backspace returns. q or Ctrl+C exits."
    );
  } else if (appState.screen === "ios") {
    const visibleIos = getVisibleIosSimulators();
    renderSelectableList(
      `${icons.ios} Select iOS simulator`,
      visibleIos.length > 0
        ? visibleIos.map((device) => `${device.name} (${device.runtime}) - ${device.state}`)
        : [paint("No iOS simulators match current filter.", "dim")],
      appState.iosIndex,
      "Enter launches selected device. Press f to filter. Esc/Backspace returns. q exits."
    );
  } else if (appState.screen === "android") {
    const visibleAndroid = getVisibleAndroidAvds();
    renderSelectableList(
      `${icons.android} Select Android emulator`,
      visibleAndroid.length > 0 ? visibleAndroid : [paint("No Android emulators match current filter.", "dim")],
      appState.androidIndex,
      "Enter launches selected AVD. Press f to filter. Esc/Backspace returns. q exits."
    );
  } else {
    process.stdout.write(`${paint("Active devices", "cyan")}\n\n`);
    process.stdout.write(`${paint(`${icons.ios} [iOS]`, "magenta")}\n`);
    process.stdout.write(`${appState.activeDevices.ios}\n\n`);
    process.stdout.write(`${paint(`${icons.android} [Android]`, "green")}\n`);
    process.stdout.write(`${appState.activeDevices.android}\n\n`);
    process.stdout.write(`${paint("Esc/Backspace returns to main menu. q exits.", "dim")}\n`);
  }

  process.stdout.write(`\n${paint("Status:", "yellow")} `);
  if (appState.filterActive && (appState.screen === "ios" || appState.screen === "android")) {
    process.stdout.write(paint(`Filter mode: ${getCurrentFilterQuery() || "(type to filter)"}`, "yellow"));
  } else {
    process.stdout.write(appState.busy ? paint("Working...", "yellow") : appState.statusMessage);
  }
  process.stdout.write("\n");
}
