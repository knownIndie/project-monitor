import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, slugify, updateProjectStatus } from "../scripts/lib.mjs";

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

test("updateProjectStatus durably changes status and timestamp", () => {
  const registry = [{ slug: "camera-phone", status: "active", updatedAt: "2026-01-01T00:00:00.000Z" }];
  const updated = updateProjectStatus(registry, "camera-phone", "inactive", "2026-06-19T00:00:00.000Z");

  assert.equal(updated.status, "inactive");
  assert.equal(registry[0].updatedAt, "2026-06-19T00:00:00.000Z");
});

test("updateProjectStatus rejects unknown projects", () => {
  assert.throws(() => updateProjectStatus([], "missing", "active"), /Unknown project/);
});
