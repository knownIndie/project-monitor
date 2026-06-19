import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, slugify } from "../scripts/lib.mjs";

test("slugify produces stable URL-safe slugs", () => {
  assert.equal(slugify("Camera Phone: Build Notes"), "camera-phone-build-notes");
});

test("parseArgs handles values and boolean pinned flag", () => {
  assert.deepEqual(parseArgs(["--title", "Camera Phone", "--status", "active", "--pinned"]), {
    title: "Camera Phone",
    status: "active",
    pinned: true
  });
});
