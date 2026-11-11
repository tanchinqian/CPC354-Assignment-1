import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEPTH_LIMITS } from "../src/config.js";
import { readSettings } from "../src/ui.js";

// The HTML guidance and JavaScript validation must agree about accepted depth.
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const input = html.match(/<input\b[^>]*id="depth"[^>]*>/)[0];
assert.ok(input.includes(`min="${DEPTH_LIMITS.min}"`));
assert.ok(input.includes(`max="${DEPTH_LIMITS.max}"`));

function readDepth(value) {
  const controls = {
    depth: { value: String(value) }, speed: { value: "1" }, color: { value: "#cc1539" }
  };
  return readSettings({ getElementById: (id) => controls[id] }).depth;
}

for (const depth of [DEPTH_LIMITS.min, 0.5, DEPTH_LIMITS.max]) {
  assert.equal(readDepth(depth), depth);
}
for (const depth of ["", 0, -1, 0.001, 1.01, 5, 20, Infinity, "invalid"]) {
  assert.throws(() => readDepth(depth), /Extrusion depth must be between/);
}
console.log("PASS: depth boundaries, invalid input and matching HTML limits.");
