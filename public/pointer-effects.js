// A click-sized flourish, not a replacement cursor or a continuous tracking effect.
export const MAX_POINTER_PULSES = 4;
export const PULSE_TIMEOUT_MS = 700;

export function canShowPointerPulse(event, {
  motionAllowed = false,
  finePointer = false,
  blockedTarget = false,
  hasSelection = false,
  pageVisible = true,
} = {}) {
  return Boolean(
    motionAllowed && finePointer && pageVisible && !blockedTarget && !hasSelection &&
    event?.pointerType === "mouse" && event.button === 0 && event.isPrimary !== false &&
    !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
    Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
  );
}

export function pointerDragged(start, event, threshold = 6) {
  return Boolean(start && Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY) &&
    Math.hypot(event.clientX - start.x, event.clientY - start.y) > threshold);
}

if (typeof document !== "undefined" && typeof window !== "undefined" && window.matchMedia) {
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const pointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const pulses = new Map();
  let layer;
  let gesture;

  const blockedSelector = [
    "input", "textarea", "select", "option", "[contenteditable]:not([contenteditable='false'])",
    "[role='textbox']", "[role='searchbox']", "[role='combobox']",
    "[disabled]", "[aria-disabled='true']", "[inert]", "[hidden]",
    "[data-pointer-effects='off']",
  ].join(",");

  function removePulse(pulse) {
    window.clearTimeout(pulses.get(pulse));
    pulses.delete(pulse);
    pulse.remove();
    if (gesture?.pulse === pulse) gesture = undefined;
    if (!pulses.size) {
      layer?.remove();
      layer = undefined;
    }
  }

  function clearPulses() {
    for (const pulse of [...pulses.keys()]) removePulse(pulse);
    gesture = undefined;
  }

  function showPulse(event) {
    // A selection drag should remain an ordinary text-selection interaction.
    const selection = document.getSelection();
    const element = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!canShowPointerPulse(event, {
      motionAllowed: motion.matches,
      finePointer: pointer.matches,
      blockedTarget: Boolean(element?.closest(blockedSelector)),
      hasSelection: Boolean(selection && !selection.isCollapsed),
      pageVisible: document.visibilityState !== "hidden",
    })) return;

    if (pulses.size >= MAX_POINTER_PULSES) removePulse(pulses.keys().next().value);
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "pointer-effects-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.append(layer);
    }
    const pulse = document.createElement("span");
    pulse.className = "pointer-click-pulse";
    pulse.style.setProperty("--pointer-x", `${event.clientX}px`);
    pulse.style.setProperty("--pointer-y", `${event.clientY}px`);
    for (const part of ["outer", "inner", "crosshair"]) {
      const mark = document.createElement("span");
      mark.className = `pointer-pulse-${part}`;
      pulse.append(mark);
    }
    // Every part ends together; retain a short fallback for interrupted animations.
    pulse.addEventListener("animationend", () => removePulse(pulse), { once: true });
    pulses.set(pulse, window.setTimeout(() => removePulse(pulse), PULSE_TIMEOUT_MS));
    layer.append(pulse);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, pulse };
  }

  document.addEventListener("pointerdown", showPulse, { passive: true });
  document.addEventListener("pointermove", (event) => {
    if (gesture?.id === event.pointerId && pointerDragged(gesture, event)) removePulse(gesture.pulse);
  }, { passive: true });
  document.addEventListener("pointerup", (event) => {
    if (gesture?.id === event.pointerId) gesture = undefined;
  }, { passive: true });
  document.addEventListener("pointercancel", (event) => {
    if (gesture?.id === event.pointerId) removePulse(gesture.pulse);
  }, { passive: true });
  document.addEventListener("selectionchange", () => {
    if (gesture && !document.getSelection()?.isCollapsed) removePulse(gesture.pulse);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") clearPulses();
  });
  motion.addEventListener("change", clearPulses);
  pointer.addEventListener("change", clearPulses);
  window.addEventListener("pagehide", clearPulses);
}
