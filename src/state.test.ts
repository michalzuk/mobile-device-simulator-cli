import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

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

const defaultState = {
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

  test("getVisibleAndroidAvds filters case-insensitively", () => {
    appState.androidAvds = ["Pixel_8_API_35", "Nexus_5X_API_28"];
    appState.androidFilterQuery = "pixel";

    assert.deepEqual(getVisibleAndroidAvds(), ["Pixel_8_API_35"]);
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
});
