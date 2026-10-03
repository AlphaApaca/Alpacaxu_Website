import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canShowPointerPulse, pointerDragged, MAX_POINTER_PULSES, PULSE_TIMEOUT_MS } from "../public/pointer-effects.js";

const mouse = { pointerType: "mouse", button: 0, isPrimary: true, clientX: 120, clientY: 80 };
const ready = { motionAllowed: true, finePointer: true };

test("click flourish is opt-in to a visible fine pointer with motion enabled", () => {
  assert.equal(canShowPointerPulse(mouse), false);
  assert.equal(canShowPointerPulse(mouse, ready), true);
  for (const state of [
    { motionAllowed: false }, { finePointer: false }, { pageVisible: false },
    { hasSelection: true }, { blockedTarget: true },
  ]) assert.equal(canShowPointerPulse(mouse, { ...ready, ...state }), false, JSON.stringify(state));
});

test("only plain primary left-mouse actions trigger a flourish", () => {
  for (const changed of [
    { pointerType: "touch" }, { pointerType: "pen" }, { pointerType: "" },
    { button: 1 }, { button: 2 }, { isPrimary: false },
    { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true },
    { clientX: NaN }, { clientY: Infinity }, { clientX: undefined },
  ]) assert.equal(canShowPointerPulse({ ...mouse, ...changed }, ready), false, JSON.stringify(changed));
  assert.equal(canShowPointerPulse(undefined, ready), false);
  assert.equal(canShowPointerPulse({ ...mouse, clientX: 0, clientY: 0 }, ready), true);
});

test("selection and movement can cancel a pulse without treating small pointer jitter as a drag", () => {
  const start = { x: 10, y: 20 };
  assert.equal(pointerDragged(start, { clientX: 13, clientY: 24 }), false);
  assert.equal(pointerDragged(start, { clientX: 16, clientY: 20 }), false);
  assert.equal(pointerDragged(start, { clientX: 17, clientY: 20 }), true);
  assert.equal(pointerDragged(undefined, mouse), false);
  assert.equal(pointerDragged(start, { clientX: NaN, clientY: 20 }), false);
});

test("effect lifetime is bounded, passive and independent of navigation or the system cursor", async () => {
  const js = await readFile(new URL("../public/pointer-effects.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/pointer-effects.css", import.meta.url), "utf8");
  assert.ok(MAX_POINTER_PULSES > 0 && MAX_POINTER_PULSES <= 5);
  assert.ok(PULSE_TIMEOUT_MS > 0 && PULSE_TIMEOUT_MS <= 1000);
  assert.match(js, /pulses\.size >= MAX_POINTER_PULSES/);
  assert.match(js, /"animationend"/);
  assert.match(js, /"pagehide", clearPulses/);
  assert.match(js, /motion\.addEventListener\("change", clearPulses\)/);
  assert.match(js, /pointer\.addEventListener\("change", clearPulses\)/);
  assert.match(js, /"pointerdown", showPulse, \{ passive: true \}/);
  assert.match(js, /setAttribute\("aria-hidden", "true"\)/);
  assert.match(js, /\[contenteditable\]/);
  assert.match(js, /\[aria-disabled='true'\]/);
  assert.match(css, /position: fixed/);
  assert.match(css, /pointer-events: none/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js, /preventDefault|stopPropagation|requestAnimationFrame|setInterval/);
  assert.doesNotMatch(css, /cursor:\s*none|:focus[^\n]*outline:\s*none/);
});
