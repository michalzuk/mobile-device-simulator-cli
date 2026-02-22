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
  bootedAndroidAvdNames: [],
  recentIosUdids: [],
  recentAndroidAvdNames: [],
  activeDevices: {
    ios: "",
    android: ""
  }
};

function partitionByIds<T>(
  items: T[],
  getId: (item: T) => string,
  ids: string[]
): { matched: T[]; others: T[] } {
  const idSet = new Set(ids);
  const idRank = new Map(ids.map((id, index) => [id, index]));

  const matched = items
    .filter((item) => idSet.has(getId(item)))
    .sort((a, b) => (idRank.get(getId(a)) ?? Number.MAX_SAFE_INTEGER) - (idRank.get(getId(b)) ?? Number.MAX_SAFE_INTEGER));

  const others = items.filter((item) => !idSet.has(getId(item)));
  return { matched, others };
}

export function getVisibleIosSimulatorGroups(): { booted: IosSimulator[]; recent: IosSimulator[]; others: IosSimulator[] } {
  const query = appState.iosFilterQuery.trim().toLowerCase();
  const filtered =
    query.length === 0
      ? appState.iosSimulators
      : appState.iosSimulators.filter((device) => {
          const haystack = `${device.name} ${device.runtime} ${device.state}`.toLowerCase();
          return haystack.includes(query);
        });

  const booted = filtered.filter((device) => device.state.toLowerCase() === "booted");
  const nonBooted = filtered.filter((device) => device.state.toLowerCase() !== "booted");
  const recentPartition = partitionByIds(nonBooted, (device) => device.udid, appState.recentIosUdids);

  return {
    booted,
    recent: recentPartition.matched,
    others: recentPartition.others
  };
}

export function getVisibleAndroidAvdGroups(): { booted: string[]; recent: string[]; others: string[] } {
  const query = appState.androidFilterQuery.trim().toLowerCase();
  const filtered = query.length === 0 ? appState.androidAvds : appState.androidAvds.filter((avd) => avd.toLowerCase().includes(query));
  const bootedPartition = partitionByIds(filtered, (avd) => avd, appState.bootedAndroidAvdNames);
  const recentPartition = partitionByIds(bootedPartition.others, (avd) => avd, appState.recentAndroidAvdNames);

  return {
    booted: bootedPartition.matched,
    recent: recentPartition.matched,
    others: recentPartition.others
  };
}

export function getVisibleIosSimulators(): IosSimulator[] {
  const groups = getVisibleIosSimulatorGroups();
  return [...groups.booted, ...groups.recent, ...groups.others];
}

export function getVisibleAndroidAvds(): string[] {
  const groups = getVisibleAndroidAvdGroups();
  return [...groups.booted, ...groups.recent, ...groups.others];
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
