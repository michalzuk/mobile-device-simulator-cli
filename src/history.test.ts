import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { pushRecentAndroidAvdName, pushRecentIosUdid } from "./history.js";

describe("history", () => {
  test("pushRecentIosUdid prepends and deduplicates", () => {
    const next = pushRecentIosUdid("udid-3", ["udid-1", "udid-2", "udid-3"]);
    assert.deepEqual(next, ["udid-3", "udid-1", "udid-2"]);
  });

  test("pushRecentAndroidAvdName caps list size", () => {
    const next = pushRecentAndroidAvdName("Pixel_9_API_36", [
      "Pixel_8_API_35",
      "Pixel_7_API_34",
      "Nexus_5X_API_28",
      "Tablet_API_33",
      "Legacy_API_27"
    ]);

    assert.deepEqual(next, [
      "Pixel_9_API_36",
      "Pixel_8_API_35",
      "Pixel_7_API_34",
      "Nexus_5X_API_28",
      "Tablet_API_33"
    ]);
  });
});
