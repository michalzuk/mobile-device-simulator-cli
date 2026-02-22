import { icons, mainMenuItems, paint } from "./constants.js";
import { appState, getCurrentFilterQuery, getVisibleAndroidAvds, getVisibleIosSimulators } from "./state.js";

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
  process.stdout.write(`\n${paint(hint, "dim")}\n`);
}

function renderHeader(): void {
  process.stdout.write(`${paint(`${icons.menu} Mobile Device Simulator CLI`, "blue")}\n`);
  process.stdout.write(`${paint(rule(), "dim")}\n\n`);
}

function renderFooterStatus(): void {
  const isFilterScreen = appState.screen === "ios" || appState.screen === "android";
  const mode = appState.busy ? paint("Working", "yellow") : paint("Ready", "green");
  process.stdout.write(`\n${paint("Mode", "dim")}: ${mode} · ${paint("Screen", "dim")}: ${paint(appState.screen, "magenta")}\n`);

  if (appState.filterActive && isFilterScreen) {
    process.stdout.write(`${paint("Filter", "yellow")}: ${paint(getCurrentFilterQuery() || "(type to filter)", "yellow")}\n`);
  } else {
    process.stdout.write(`${paint("Status", "yellow")}: ${appState.statusMessage}\n`);
  }

  process.stdout.write(
    `${paint("Keys", "dim")}: ${paint("Up/Down", "cyan")} move · ${paint("Enter", "cyan")} select · ${paint("f", "cyan")} filter · ${paint("Esc/Backspace", "cyan")} back · ${paint("q", "cyan")} quit\n`
  );
}

export function render(): void {
  clearScreen();
  renderHeader();

  if (appState.screen === "main") {
    renderSelectableList(
      "Main Menu",
      mainMenuItems.map((item) => `${item.label} - ${item.description}`),
      appState.mainIndex,
      "Choose a workflow and press Enter.",
      `${mainMenuItems.length} actions`
    );
  } else if (appState.screen === "ios") {
    const visibleIos = getVisibleIosSimulators();
    renderSelectableList(
      `${icons.ios} iOS Simulators`,
      visibleIos.length > 0
        ? visibleIos.map((device) => `${device.name} (${device.runtime}) - ${device.state}`)
        : ["No iOS simulators match current filter."],
      appState.iosIndex,
      "Press Enter to boot selected simulator.",
      `${visibleIos.length} visible`
    );
  } else if (appState.screen === "android") {
    const visibleAndroid = getVisibleAndroidAvds();
    renderSelectableList(
      `${icons.android} Android Emulators`,
      visibleAndroid.length > 0 ? visibleAndroid : ["No Android emulators match current filter."],
      appState.androidIndex,
      "Press Enter to launch selected AVD.",
      `${visibleAndroid.length} visible`
    );
  } else {
    sectionTitle("Connected Devices", "live snapshot");
    process.stdout.write(`${paint(`${icons.ios} iOS`, "magenta")}\n`);
    process.stdout.write(`${appState.activeDevices.ios}\n\n`);
    process.stdout.write(`${paint(`${icons.android} Android`, "green")}\n`);
    process.stdout.write(`${appState.activeDevices.android}\n`);
  }

  renderFooterStatus();
}
