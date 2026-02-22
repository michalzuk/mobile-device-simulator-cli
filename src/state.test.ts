import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  appState,
  backToMainMenu,
  clampIndex,
  getCurrentFilterQuery,
  parseActiveAndroidRows,
  parseActiveIosRows,
  getVisibleAndroidAvdGroups,
  getVisibleAndroidAvds,
  getVisibleIosSimulatorGroups,
  getVisibleIosSimulators,
  normalizeSelection,
  setCurrentFilterQuery
} from "./state.js";

const defaultState = {
  screen: "main",
  mainIndex: 0,
  iosIndex: 0,
  androidIndex: 0,
  iosFilterQuery: "",
  androidFilterQuery: "",
  filterActive: false,
  statusMessage: "Use Up/Down + Enter. Esc/Backspace returns to main menu. Press Ctrl+C to exit.",
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
} as const;

function resetAppState(): void {
  appState.screen = defaultState.screen;
  appState.mainIndex = defaultState.mainIndex;
  appState.iosIndex = defaultState.iosIndex;
  appState.androidIndex = defaultState.androidIndex;
  appState.iosFilterQuery = defaultState.iosFilterQuery;
  appState.androidFilterQuery = defaultState.androidFilterQuery;
  appState.filterActive = defaultState.filterActive;
  appState.statusMessage = defaultState.statusMessage;
  appState.busy = defaultState.busy;
  appState.iosSimulators = [...defaultState.iosSimulators];
  appState.androidAvds = [...defaultState.androidAvds];
  appState.bootedAndroidAvdNames = [...defaultState.bootedAndroidAvdNames];
  appState.recentIosUdids = [...defaultState.recentIosUdids];
  appState.recentAndroidAvdNames = [...defaultState.recentAndroidAvdNames];
  appState.activeDevices = {
    ios: defaultState.activeDevices.ios,
    android: defaultState.activeDevices.android
  };
}

describe("state", () => {
  beforeEach(() => {
    resetAppState();
  });

  test("clampIndex wraps and handles empty lists", () => {
    assert.equal(clampIndex(0, 0), 0);
    assert.equal(clampIndex(-1, 3), 2);
    assert.equal(clampIndex(3, 3), 0);
    assert.equal(clampIndex(1, 3), 1);
  });

  test("getVisibleIosSimulators filters by name runtime and state", () => {
    appState.iosSimulators = [
      { udid: "1", name: "iPhone 15", runtime: "iOS-17-5", state: "Shutdown" },
      { udid: "2", name: "iPad Pro", runtime: "iOS-18-0", state: "Booted" }
    ];

    appState.iosFilterQuery = "booted";
    const byState = getVisibleIosSimulators();
    assert.equal(byState.length, 1);
    assert.equal(byState[0]?.name, "iPad Pro");

    appState.iosFilterQuery = "iphone";
    const byName = getVisibleIosSimulators();
    assert.equal(byName.length, 1);
    assert.equal(byName[0]?.name, "iPhone 15");
  });

  test("getVisibleIosSimulatorGroups prioritizes booted then recent IDs", () => {
    appState.iosSimulators = [
      { udid: "1", name: "iPhone 15", runtime: "iOS-17-5", state: "Shutdown" },
      { udid: "2", name: "iPhone 16", runtime: "iOS-18-0", state: "Booted" },
      { udid: "3", name: "iPhone SE", runtime: "iOS-17-0", state: "Shutdown" }
    ];
    appState.recentIosUdids = ["2", "3"];

    const groups = getVisibleIosSimulatorGroups();
    assert.deepEqual(
      groups.booted.map((item) => item.udid),
      ["2"]
    );
    assert.deepEqual(
      groups.recent.map((item) => item.udid),
      ["3"]
    );
    assert.deepEqual(
      groups.others.map((item) => item.udid),
      ["1"]
    );
  });

  test("getVisibleAndroidAvds filters case-insensitively", () => {
    appState.androidAvds = ["Pixel_8_API_35", "Nexus_5X_API_28"];
    appState.androidFilterQuery = "pixel";

    assert.deepEqual(getVisibleAndroidAvds(), ["Pixel_8_API_35"]);
  });

  test("getVisibleAndroidAvdGroups prioritizes booted then recent names", () => {
    appState.androidAvds = ["Pixel_8_API_35", "Nexus_5X_API_28", "Pixel_7_API_34"];
    appState.bootedAndroidAvdNames = ["Nexus_5X_API_28"];
    appState.recentAndroidAvdNames = ["Pixel_7_API_34"];

    const groups = getVisibleAndroidAvdGroups();
    assert.deepEqual(groups.booted, ["Nexus_5X_API_28"]);
    assert.deepEqual(groups.recent, ["Pixel_7_API_34"]);
    assert.deepEqual(groups.others, ["Pixel_8_API_35"]);
  });

  test("normalizeSelection keeps selection within visible list bounds", () => {
    appState.screen = "ios";
    appState.iosSimulators = [{ udid: "1", name: "iPhone 15", runtime: "iOS-17-5", state: "Shutdown" }];
    appState.iosIndex = 4;
    normalizeSelection();
    assert.equal(appState.iosIndex, 0);

    appState.screen = "android";
    appState.androidAvds = ["Pixel_8_API_35", "Nexus_5X_API_28"];
    appState.androidIndex = -1;
    normalizeSelection();
    assert.equal(appState.androidIndex, 1);
  });

  test("setCurrentFilterQuery and getCurrentFilterQuery respect active screen", () => {
    appState.screen = "ios";
    setCurrentFilterQuery("iphone");
    assert.equal(getCurrentFilterQuery(), "iphone");

    appState.screen = "android";
    setCurrentFilterQuery("pixel");
    assert.equal(getCurrentFilterQuery(), "pixel");

    appState.screen = "main";
    setCurrentFilterQuery("should-not-apply");
    assert.equal(getCurrentFilterQuery(), "");
    assert.equal(appState.iosFilterQuery, "iphone");
    assert.equal(appState.androidFilterQuery, "pixel");
  });

  test("backToMainMenu resets navigation and filter state", () => {
    appState.screen = "ios";
    appState.filterActive = true;
    appState.iosFilterQuery = "iphone";
    appState.androidFilterQuery = "pixel";

    backToMainMenu("Ready");

    assert.equal(appState.screen, "main");
    assert.equal(appState.filterActive, false);
    assert.equal(appState.iosFilterQuery, "");
    assert.equal(appState.androidFilterQuery, "");
    assert.equal(appState.statusMessage, "Ready");
  });

  test("parseActiveIosRows returns empty for fallback messages", () => {
    assert.deepEqual(parseActiveIosRows("No booted iOS simulators."), []);
    assert.deepEqual(parseActiveIosRows("Unable to read iOS simulator state (xcrun not available)."), []);
  });

  test("parseActiveIosRows splits formatted device lines", () => {
    const text = "iPhone 16 (iOS-18-0) - Booted\n";
    assert.deepEqual(parseActiveIosRows(text), ["iPhone 16 (iOS-18-0) - Booted"]);
  });

  test("parseActiveAndroidRows strips header and keeps device lines", () => {
    const text = [
      "List of devices attached",
      "emulator-5554 device product:sdk_gphone_x86_64",
      "R5CR30ABCDE unauthorized"
    ].join("\n");

    assert.deepEqual(parseActiveAndroidRows(text), ["emulator-5554 device product:sdk_gphone_x86_64"]);
  });
});
