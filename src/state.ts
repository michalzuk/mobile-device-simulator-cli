import type { AppState, IosSimulator } from "./types.js";

export const appState: AppState = {
  screen: "main",
  mainIndex: 0,
  iosIndex: 0,
  androidIndex: 0,
  iosFilterQuery: "",
  androidFilterQuery: "",
  filterActive: false,
  statusMessage: "Use Up/Down + Enter. Esc/Backspace returns to main menu. Press q to exit.",
  busy: false,
  iosSimulators: [],
  androidAvds: [],
  activeDevices: {
    ios: "",
    android: ""
  }
};

export function getVisibleIosSimulators(): IosSimulator[] {
  const query = appState.iosFilterQuery.trim().toLowerCase();
  if (query.length === 0) {
    return appState.iosSimulators;
  }

  return appState.iosSimulators.filter((device) => {
    const haystack = `${device.name} ${device.runtime} ${device.state}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function getVisibleAndroidAvds(): string[] {
  const query = appState.androidFilterQuery.trim().toLowerCase();
  if (query.length === 0) {
    return appState.androidAvds;
  }

  return appState.androidAvds.filter((avd) => avd.toLowerCase().includes(query));
}

export function getCurrentFilterQuery(): string {
  if (appState.screen === "ios") {
    return appState.iosFilterQuery;
  }
  if (appState.screen === "android") {
    return appState.androidFilterQuery;
  }
  return "";
}

export function setCurrentFilterQuery(nextQuery: string): void {
  if (appState.screen === "ios") {
    appState.iosFilterQuery = nextQuery;
  }
  if (appState.screen === "android") {
    appState.androidFilterQuery = nextQuery;
  }
}

export function clampIndex(nextIndex: number, size: number): number {
  if (size === 0) {
    return 0;
  }
  if (nextIndex < 0) {
    return size - 1;
  }
  if (nextIndex >= size) {
    return 0;
  }
  return nextIndex;
}

export function normalizeSelection(): void {
  if (appState.screen === "ios") {
    const visible = getVisibleIosSimulators();
    appState.iosIndex = clampIndex(appState.iosIndex, visible.length);
  }

  if (appState.screen === "android") {
    const visible = getVisibleAndroidAvds();
    appState.androidIndex = clampIndex(appState.androidIndex, visible.length);
  }
}

export function backToMainMenu(message: string): void {
  appState.screen = "main";
  appState.filterActive = false;
  appState.iosFilterQuery = "";
  appState.androidFilterQuery = "";
  appState.statusMessage = message;
}
