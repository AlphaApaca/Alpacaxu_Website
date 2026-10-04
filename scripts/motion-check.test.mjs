import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { initializeMotionCheck, motionCheckPhase, motionCheckScript } from "../src/lib/motion-check.mjs";

const storageKey = "alpaca-motion-check";
const initialState = () => ({
  revealSeen: false, hasTransition: false, ready: false, started: false, ended: false,
  finished: false, skipped: "", reduced: false, loaded: false,
});
const transitionState = (changes = {}) => ({ ...initialState(), revealSeen: true, hasTransition: true, ready: true, ...changes });

test("phase truth table preserves failure and reduced-motion precedence", () => {
  const flags = ["revealSeen", "hasTransition", "ready", "started", "ended", "finished", "reduced", "loaded"];
  const cases = [
    ["reduced", (state) => state.reduced],
    ["skipped", (state) => Boolean(state.skipped)],
    ["unobserved", (state) => !state.revealSeen && state.loaded],
    ["waiting", (state) => !state.revealSeen],
    ["none", (state) => !state.hasTransition],
    ["played", (state) => state.started && state.ended],
    ["incomplete", (state) => state.started && state.finished],
    ["no-animation", (state) => state.finished],
    ["preparing", (state) => !state.ready],
    ["running", (state) => state.started],
    ["prepared", () => true],
  ];
  for (let bits = 0; bits < 2 ** flags.length; bits++) {
    for (const skipped of ["", "InvalidStateError"]) {
      const state = Object.fromEntries(flags.map((name, index) => [name, Boolean(bits & 2 ** index)]));
      state.skipped = skipped;
      const expected = cases.find(([, matches]) => matches(state))[0];
      assert.equal(motionCheckPhase(state), expected, JSON.stringify(state));
    }
  }
});

test("snapshot promises and a lone animationend cannot claim playback", () => {
  const state = initialState();
  const phases = [motionCheckPhase(state)];
  for (const changes of [
    { loaded: true }, { revealSeen: true, hasTransition: true }, { ready: true },
    { ended: true }, { finished: true },
  ]) {
    Object.assign(state, changes);
    phases.push(motionCheckPhase(state));
  }
  assert.deepEqual(phases, ["waiting", "unobserved", "preparing", "prepared", "prepared", "no-animation"]);
  assert.equal(motionCheckPhase(transitionState({ started: true })), "running");
  assert.equal(motionCheckPhase(transitionState({ started: true, finished: true })), "incomplete");
  assert.equal(motionCheckPhase(transitionState({ started: true, ended: true })), "played");
  assert.equal(motionCheckPhase(transitionState({ started: true, ended: true, skipped: "AnimationCancelled" })), "skipped");
});

function inactiveFixture({ search = "", stored = null, blockedGetter = false, blockedRead = false, allowStorageWrite = false } = {}) {
  const effects = [];
  const writes = [];
  const fail = (name) => () => { effects.push(name); throw new Error(`Inactive diagnostics touched ${name}`); };
  const inaccessible = (name) => new Proxy({}, {
    get: fail(name), set: fail(name), deleteProperty: fail(name),
  });
  const href = `https://www.alpacaxu.cn/writing${search}#details`;
  const location = new Proxy({ href }, { set: fail("location"), deleteProperty: fail("location") });
  const storage = {
    getItem(key) {
      assert.equal(key, storageKey);
      if (blockedRead) throw new Error("Storage access denied");
      return stored;
    },
    setItem(key, value) {
      if (!allowStorageWrite) fail("storage write")();
      writes.push([key, value]);
    },
  };
  const window = {
    get sessionStorage() { if (blockedGetter) throw new Error("Storage getter denied"); return storage; },
    addEventListener: fail("window listener"),
    matchMedia: fail("media query"),
  };
  const args = {
    window, document: inaccessible("document"), location, history: inaccessible("history"),
    MutationObserver: class { constructor() { fail("observer")(); } },
    phaseFor: fail("phase calculation"),
  };
  return { args, effects, writes, href };
}

test("default-off initialization and shipped script leave all page systems untouched", () => {
  for (const options of [
    {}, { stored: "off" }, { stored: "1" }, { stored: "true" },
    { search: "?motion-check=on" }, { search: "?motion-check=true" },
    { search: "?motion-check=2" }, { search: "?category=note&motion-check=" },
  ]) {
    for (const serialized of [false, true]) {
      const fixture = inactiveFixture(options);
      assert.doesNotThrow(() => {
        if (serialized) vm.runInNewContext(motionCheckScript(), { ...fixture.args, URL });
        else initializeMotionCheck(fixture.args);
      }, JSON.stringify({ options, serialized }));
      assert.deepEqual(fixture.effects, []);
      assert.deepEqual(fixture.writes, []);
      assert.equal(fixture.args.location.href, fixture.href);
    }
  }
});

test("a throwing sessionStorage getter or getItem safely leaves diagnostics disabled", () => {
  for (const options of [{ blockedGetter: true }, { blockedRead: true }]) {
    for (const serialized of [false, true]) {
      const fixture = inactiveFixture(options);
      assert.doesNotThrow(() => {
        if (serialized) vm.runInNewContext(motionCheckScript(), { ...fixture.args, URL });
        else initializeMotionCheck(fixture.args);
      });
      assert.deepEqual(fixture.effects, []);
      assert.deepEqual(fixture.writes, []);
    }
  }
});

test("explicit opt-out overrides the tab setting and performs only its storage write", () => {
  const fixture = inactiveFixture({ search: "?motion-check=0&category=note", stored: "on", allowStorageWrite: true });
  initializeMotionCheck(fixture.args);
  assert.deepEqual(fixture.writes, [[storageKey, "off"]]);
  assert.deepEqual(fixture.effects, []);
  assert.equal(fixture.args.location.href, fixture.href);
  const blocked = inactiveFixture({ search: "?motion-check=0", blockedGetter: true });
  assert.doesNotThrow(() => initializeMotionCheck(blocked.args));
  assert.deepEqual(blocked.effects, []);
});

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== listener));
    },
    emit(type, event = {}) {
      for (const listener of [...(listeners.get(type) ?? [])]) listener({ type, ...event });
    },
  };
}

function fixture({ search = "?motion-check=1", stored = null, reduced = false, blockedGetter = false, mounted = true, completePanel = true, serialized = false } = {}) {
  const values = new Map(stored === null ? [] : [[storageKey, stored]]);
  const writes = [];
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); writes.push([key, value]); },
  };
  const window = eventTarget();
  Object.defineProperty(window, "sessionStorage", { get() { if (blockedGetter) throw new Error("Storage getter denied"); return storage; } });
  const media = { ...eventTarget(), matches: reduced };
  window.matchMedia = (query) => { assert.equal(query, "(prefers-reduced-motion: reduce)"); return media; };
  const root = { dataset: {}, lang: "en" };
  const status = { textContent: "" };
  const detail = { textContent: "" };
  const button = { ...eventTarget(), textContent: "", disabled: false };
  const controls = new Map([
    ["[data-motion-check-status]", status], ["[data-motion-check-detail]", detail], ["[data-motion-check-close]", button],
  ]);
  const panel = { dataset: {}, hidden: true, querySelector: (selector) => completePanel ? controls.get(selector) ?? null : null };
  const document = { ...eventTarget(), readyState: "loading", documentElement: root, getElementById: (id) => mounted && id === "motion-check-panel" ? panel : null };
  const observers = [];
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; this.active = true; }
    disconnect() { this.active = false; }
  }
  const location = { href: `https://www.alpacaxu.cn/writing${search}#details` };
  const replacements = [];
  const history = { state: { saved: 1 }, replaceState(...args) { replacements.push(args); } };
  const args = { window, document, location, history, MutationObserver, phaseFor: motionCheckPhase };
  if (serialized) vm.runInNewContext(motionCheckScript(), { ...args, URL });
  else initializeMotionCheck(args);
  return {
    window, document, root, media, panel, status, detail, button, observers, values, writes, replacements,
    mount({ complete = true } = {}) { mounted = true; completePanel = complete; for (const observer of observers) if (observer.active && observer.target === document) observer.callback([]); },
    animate(type, changes = {}) {
      document.emit(type, { target: root, animationName: "page-content-enter", pseudoElement: "::view-transition-new(page-content)", elapsedTime: 0.6, ...changes });
    },
    phase: () => panel.dataset.phase,
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

function reveal(fixture) {
  const ready = deferred();
  const finished = deferred();
  fixture.window.emit("pagereveal", { viewTransition: { ready: ready.promise, finished: finished.promise } });
  return { ready, finished };
}

const settle = async () => { await Promise.resolve(); };

test("explicit and saved opt-in mount the diagnostic panel and choose the visible language", () => {
  for (const options of [{}, { search: "", stored: "on" }, { serialized: true }]) {
    const page = fixture(options);
    assert.equal(page.root.dataset.motionCheck, "true");
    assert.equal(page.panel.hidden, false);
    assert.equal(page.phase(), "waiting");
    assert.equal(page.values.get(storageKey), "on");
    assert.match(page.status.textContent, /Waiting/);
    page.root.lang = "zh-CN";
    page.observers.find((observer) => observer.target === page.root).callback([]);
    assert.equal(page.status.textContent, "等待页面进入事件");
    assert.equal(page.button.textContent, "关闭调试");
  }
});

test("explicit opt-in still works when tab storage is inaccessible and explains persistence", () => {
  const page = fixture({ blockedGetter: true });
  assert.equal(page.phase(), "waiting");
  assert.equal(page.root.dataset.motionCheck, "true");
  assert.match(page.detail.textContent, /storage is unavailable/);
  assert.deepEqual(page.writes, []);
});

test("parser completion without pagereveal reports unobserved; an entry without a transition reports none", () => {
  const page = fixture();
  page.document.emit("DOMContentLoaded");
  assert.equal(page.phase(), "unobserved");
  page.window.emit("pagereveal", { viewTransition: null });
  assert.equal(page.phase(), "none");
  page.animate("animationstart");
  page.animate("animationend");
  assert.equal(page.phase(), "none");
});

test("ready and finished are observed without fabricating any animation event", async () => {
  const page = fixture();
  const attempt = reveal(page);
  assert.equal(page.phase(), "preparing");
  assert.equal(page.button.disabled, true);
  attempt.ready.resolve();
  await settle();
  assert.equal(page.phase(), "prepared");
  attempt.finished.resolve();
  await settle();
  assert.equal(page.phase(), "no-animation");
  assert.equal(page.button.disabled, false);
  assert.doesNotMatch(page.status.textContent, /Content fade played/);
});

test("finished-before-ready settles honestly, while both animation events are direct evidence", async () => {
  for (const started of [false, true]) {
    const page = fixture();
    const attempt = reveal(page);
    if (started) page.animate("animationstart");
    attempt.finished.resolve();
    await settle();
    assert.equal(page.phase(), started ? "incomplete" : "no-animation");
  }
  const page = fixture();
  reveal(page);
  page.animate("animationstart");
  page.animate("animationend");
  assert.equal(page.phase(), "played");
});

test("only content-enter events on the incoming main snapshot prove playback", async () => {
  const page = fixture();
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  for (const changes of [
    { animationName: "page-header-enter" }, { animationName: "other-animation" },
    { pseudoElement: "::view-transition-new(root)" }, { pseudoElement: "::view-transition-new(site-header)" },
    { pseudoElement: "::view-transition-old(page-content)" }, { pseudoElement: "" },
  ]) {
    page.animate("animationstart", changes);
    page.animate("animationend", changes);
    assert.equal(page.phase(), "prepared", JSON.stringify(changes));
  }
  page.animate("animationstart");
  assert.equal(page.phase(), "running");
  page.animate("animationend", { elapsedTime: 0.6 });
  assert.equal(page.phase(), "played");
  assert.match(page.status.textContent, /600ms/);
  attempt.finished.resolve();
  await settle();
  assert.equal(page.phase(), "played");
});

test("an animationend without a matching start stays unconfirmed after promise completion", async () => {
  const page = fixture();
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  page.animate("animationend");
  assert.equal(page.phase(), "prepared");
  attempt.finished.resolve();
  await settle();
  assert.equal(page.phase(), "no-animation");
});

test("a started animation without an observed end is incomplete, never played", async () => {
  const page = fixture();
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  page.animate("animationstart");
  attempt.finished.resolve();
  await settle();
  assert.equal(page.phase(), "incomplete");
});

test("ready rejection and animation cancellation expose the reason as skipped", async () => {
  const page = fixture();
  const rejected = reveal(page);
  rejected.ready.reject({ name: "InvalidStateError" });
  await settle();
  assert.equal(page.phase(), "skipped");
  assert.match(page.status.textContent, /InvalidStateError/);
  rejected.finished.resolve();
  await settle();
  assert.equal(page.phase(), "skipped");
  const cancelled = reveal(page);
  cancelled.ready.resolve();
  await settle();
  page.animate("animationstart");
  page.animate("animationcancel");
  assert.equal(page.phase(), "skipped");
  assert.match(page.status.textContent, /AnimationCancelled/);
});

test("a rejected completion promise supplies no playback evidence", async () => {
  const page = fixture();
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  attempt.finished.reject(new Error("Transition failed"));
  await settle();
  assert.equal(page.phase(), "skipped");
  assert.match(page.status.textContent, /Error/);
  assert.equal(page.button.disabled, false);
});

test("reduced-motion preference remains explicit even if a transition was skipped", async () => {
  const page = fixture({ reduced: true });
  assert.equal(page.phase(), "reduced");
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  page.animate("animationstart");
  page.animate("animationend");
  assert.equal(page.phase(), "reduced");
  page.media.matches = false;
  page.media.emit("change");
  assert.equal(page.phase(), "played");
  page.animate("animationcancel");
  assert.equal(page.phase(), "skipped");
  page.media.matches = true;
  page.media.emit("change");
  assert.equal(page.phase(), "reduced");
});

test("a new reveal discards old animation evidence and ignores previous promise settlement", async () => {
  const page = fixture();
  const old = reveal(page);
  page.animate("animationstart");
  page.animate("animationend");
  const current = reveal(page);
  old.ready.resolve();
  old.finished.resolve();
  await settle();
  assert.equal(page.phase(), "preparing");
  current.ready.resolve();
  await settle();
  assert.equal(page.phase(), "prepared");
  current.finished.resolve();
  await settle();
  assert.equal(page.phase(), "no-animation");
});

test("a streamed panel waits for every child while retaining animation evidence", async () => {
  const page = fixture({ mounted: false });
  const parser = page.observers.find((observer) => observer.target === page.document);
  assert.equal(parser.active, true);
  assert.equal(page.panel.hidden, true);
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  page.animate("animationstart");
  page.animate("animationend");
  assert.doesNotThrow(() => page.mount({ complete: false }));
  assert.equal(page.panel.hidden, true);
  assert.equal(parser.active, true);
  page.mount();
  assert.equal(page.panel.hidden, false);
  assert.equal(page.phase(), "played");
  assert.equal(parser.active, false);
  assert.equal(page.button.listeners.get("click").length, 1);
  page.mount();
  assert.equal(page.button.listeners.get("click").length, 1);
});

test("BFCache restore without a new reveal clears prior success and preserves tab opt-in", async () => {
  const page = fixture();
  const attempt = reveal(page);
  attempt.ready.resolve();
  await settle();
  page.animate("animationstart");
  page.animate("animationend");
  assert.equal(page.phase(), "played");
  page.document.readyState = "complete";
  page.window.emit("pagehide", { persisted: true });
  attempt.finished.resolve();
  await settle();
  page.window.emit("pageshow", { persisted: true });
  assert.equal(page.phase(), "unobserved");
  assert.equal(page.values.get(storageKey), "on");
  assert.equal(page.root.dataset.motionCheck, "true");
  assert.equal(page.panel.hidden, false);
  assert.equal(page.button.disabled, false);
});

test("BFCache pageshow preserves a newly observed reveal without reusing old events", async () => {
  const page = fixture();
  const first = reveal(page);
  first.ready.resolve();
  await settle();
  page.animate("animationstart");
  page.animate("animationend");
  page.window.emit("pagehide", { persisted: true });
  const restored = reveal(page);
  page.window.emit("pageshow", { persisted: true });
  assert.equal(page.phase(), "preparing");
  first.finished.resolve();
  restored.ready.resolve();
  await settle();
  assert.equal(page.phase(), "prepared");
  restored.finished.resolve();
  await settle();
  assert.equal(page.phase(), "no-animation");
});

test("close disables tab mode, removes observers and listeners, and preserves the rest of the URL", () => {
  const page = fixture({ search: "?category=note&motion-check=1&q=animation" });
  assert.equal(page.button.disabled, false);
  page.button.emit("click");
  assert.equal(page.root.dataset.motionCheck, undefined);
  assert.equal(page.panel.hidden, true);
  assert.equal(page.values.get(storageKey), "off");
  assert.ok(page.observers.every((observer) => !observer.active));
  for (const target of [page.window, page.document, page.media]) {
    assert.ok([...target.listeners.values()].every((listeners) => listeners.length === 0));
  }
  assert.deepEqual(page.replacements, [[{ saved: 1 }, "", "https://www.alpacaxu.cn/writing?category=note&q=animation#details"]]);
  page.window.emit("pagereveal", { viewTransition: null });
  page.document.emit("DOMContentLoaded");
  page.animate("animationstart");
  page.animate("animationend");
  assert.equal(page.panel.hidden, true);
});

test("a restored page respects a tab setting disabled elsewhere", () => {
  for (const event of ["pageshow", "pagereveal"]) {
    const page = fixture();
    page.values.set(storageKey, "off");
    page.window.emit(event, { persisted: true, viewTransition: null });
    assert.equal(page.panel.hidden, true);
    assert.equal(page.root.dataset.motionCheck, undefined);
    assert.equal(page.values.get(storageKey), "off");
  }
});

test("closing after a failed attempt ignores late promises and repeated close actions", async () => {
  const page = fixture();
  const attempt = reveal(page);
  attempt.ready.reject({ name: "InvalidStateError" });
  await settle();
  assert.equal(page.button.disabled, false);
  page.button.emit("click");
  attempt.finished.resolve();
  await settle();
  page.button.emit("click");
  assert.equal(page.panel.hidden, true);
  assert.equal(page.root.dataset.motionCheck, undefined);
  assert.equal(page.values.get(storageKey), "off");
  assert.equal(page.replacements.length, 1);
});

test("the shipped head script has no network, delayed startup, body hiding, or navigation interception", () => {
  const script = motionCheckScript();
  assert.doesNotMatch(script, /<\/script>|\b(?:fetch|import|setTimeout|setInterval|requestAnimationFrame|preventDefault|stopPropagation|stopImmediatePropagation)\s*\(/);
  assert.doesNotMatch(script, /XMLHttpRequest|document\.body\.(?:hidden|style)|location\.(?:assign|replace)\s*\(/);
  assert.doesNotMatch(script, /addEventListener\(["'](?:pointerdown|mousedown|submit)["']/);
  assert.match(script, /pagereveal/);
  assert.match(script, /animationstart/);
  assert.match(script, /animationend/);
});
