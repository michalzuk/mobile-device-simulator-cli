import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HISTORY_PATH = join(homedir(), ".mobile-device-simulator-history.json");
const MAX_RECENT_ITEMS = 5;

type DeviceHistory = {
  recentIosUdids: string[];
  recentAndroidAvdNames: string[];
};

const EMPTY_HISTORY: DeviceHistory = {
  recentIosUdids: [],
  recentAndroidAvdNames: []
};

function normalizeHistory(raw: unknown): DeviceHistory {
  if (!raw || typeof raw !== "object") {
    return EMPTY_HISTORY;
  }

  const history = raw as Partial<DeviceHistory>;
  const recentIosUdids = Array.isArray(history.recentIosUdids)
    ? history.recentIosUdids.filter((item): item is string => typeof item === "string")
    : [];

  const recentAndroidAvdNames = Array.isArray(history.recentAndroidAvdNames)
    ? history.recentAndroidAvdNames.filter((item): item is string => typeof item === "string")
    : [];

  return {
    recentIosUdids,
    recentAndroidAvdNames
  };
}

function dedupeRecent(nextId: string, existing: string[], maxItems = MAX_RECENT_ITEMS): string[] {
  const list = [nextId, ...existing.filter((id) => id !== nextId)];
  return list.slice(0, maxItems);
}

export function loadDeviceHistory(): DeviceHistory {
  try {
    const raw = readFileSync(HISTORY_PATH, "utf8");
    return normalizeHistory(JSON.parse(raw));
  } catch {
    return EMPTY_HISTORY;
  }
}

export function saveDeviceHistory(history: DeviceHistory): void {
  const normalized = normalizeHistory(history);
  writeFileSync(HISTORY_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

export function pushRecentIosUdid(udid: string, existing: string[]): string[] {
  return dedupeRecent(udid, existing);
}

export function pushRecentAndroidAvdName(avdName: string, existing: string[]): string[] {
  return dedupeRecent(avdName, existing);
}
