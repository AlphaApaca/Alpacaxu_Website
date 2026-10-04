// Opt-in, tab-local acceptance aid. Never use promise completion as animation proof.
export function motionCheckPhase(state) {
  if (state.reduced) return "reduced";
  if (state.skipped) return "skipped";
  if (!state.revealSeen) return state.loaded ? "unobserved" : "waiting";
  if (!state.hasTransition) return "none";
  if (state.started && state.ended) return "played";
  if (state.finished) return state.started ? "incomplete" : "no-animation";
  if (!state.ready) return "preparing";
  if (state.started) return "running";
  return "prepared";
}

export function initializeMotionCheck({ window, document, location, history, MutationObserver, phaseFor }) {
  const key = "alpaca-motion-check";
  const url = new URL(location.href);
  const explicit = url.searchParams.get("motion-check");
  let storage;
  let stored;
  let storageAvailable = true;
  try {
    storage = window.sessionStorage;
    stored = storage.getItem(key);
  } catch { storageAvailable = false; }
  if (explicit === "0") {
    try { storage?.setItem(key, "off"); } catch { /* The current page still opts out. */ }
    return;
  }
  if (explicit !== "1" && stored !== "on") return;
  try { storage?.setItem(key, "on"); } catch { storageAvailable = false; }

  const root = document.documentElement;
  root.dataset.motionCheck = "true";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let closed = false;
  let cycle = 0;
  let panel;
  let parseObserver;
  let state = {};
  const reset = () => {
    cycle += 1;
    state = { revealSeen: false, hasTransition: false, ready: false, started: false, ended: false,
      finished: false, skipped: "", reduced: media.matches, loaded: document.readyState !== "loading", durationMs: 0 };
  };
  reset();
  const copy = {
    zh: {
      waiting: "等待页面进入事件", unobserved: "事件缺失：未收到页面过渡观察事件", none: "本次未触发过渡（首次打开或刷新时正常）",
      reduced: "减少动态效果已开启，动画不播放", preparing: "过渡已创建，正在准备快照",
      prepared: "快照已准备，尚未观测到正文动画", running: "正文淡入正在播放",
      played: "正文淡入已播放", incomplete: "动画已启动，但未观测到结束",
      "no-animation": "事件缺失：过渡已结束，未观测到正文动画", skipped: "过渡被跳过",
      detail: "验收模式 600ms · 请点击顶栏，在首页、文章、关于之间切换；刷新不会触发。",
      storage: "本标签存储不可用，验收模式无法自动延续到下一页。",
      close: "关闭调试"
    },
    en: {
      waiting: "Waiting for page entry", unobserved: "No page-transition event observed", none: "No transition on this entry (normal for a first visit or reload)",
      reduced: "Reduced motion is enabled; animation is disabled", preparing: "Transition created; preparing snapshots",
      prepared: "Snapshots ready; content animation not yet observed", running: "Content fade is playing",
      played: "Content fade played", incomplete: "Animation started; its end was not observed",
      "no-animation": "Transition finished; no content animation observed", skipped: "Transition skipped",
      detail: "600ms acceptance mode · Use the top navigation between Home, Writing and About; reloading does not trigger a transition.",
      storage: "Tab storage is unavailable; this mode cannot persist to the next page.",
      close: "Close diagnostics"
    }
  };
  const render = () => {
    if (closed || !panel) return;
    const strings = root.lang.startsWith("zh") ? copy.zh : copy.en;
    const phase = phaseFor(state);
    const status = panel.querySelector("[data-motion-check-status]");
    const detail = panel.querySelector("[data-motion-check-detail]");
    const button = panel.querySelector("[data-motion-check-close]");
    let label = strings[phase];
    if (phase === "played") label += ` · ${Math.round(state.durationMs)}ms`;
    if (phase === "skipped") label += ` · ${state.skipped}`;
    const explanation = strings.detail + (storageAvailable ? "" : ` ${strings.storage}`);
    if (status.textContent !== label) status.textContent = label;
    if (detail.textContent !== explanation) detail.textContent = explanation;
    if (button.textContent !== strings.close) button.textContent = strings.close;
    // Changing the duration mid-animation would corrupt this diagnostic attempt.
    button.disabled = state.hasTransition && !state.finished && !state.skipped;
    panel.dataset.phase = phase;
    panel.hidden = false;
  };
  const close = () => {
    if (closed) return;
    closed = true;
    cycle += 1;
    delete root.dataset.motionCheck;
    if (panel) panel.hidden = true;
    parseObserver?.disconnect();
    languageObserver.disconnect();
    window.removeEventListener("pagereveal", reveal);
    window.removeEventListener("pageshow", show);
    window.removeEventListener("pagehide", hide);
    document.removeEventListener("DOMContentLoaded", loaded);
    for (const name of ["animationstart", "animationend", "animationcancel"]) document.removeEventListener(name, animation, true);
    media.removeEventListener?.("change", preference);
    try { storage?.setItem(key, "off"); } catch { /* No persistence is needed to close this page. */ }
    try {
      const next = new URL(location.href);
      next.searchParams.delete("motion-check");
      history.replaceState(history.state, "", next.href);
    } catch { /* Closing the panel is still possible with restricted history. */ }
  };
  const wasDisabled = () => {
    try { return storage?.getItem(key) === "off"; } catch { return false; }
  };
  const reveal = (event) => {
    if (closed) return;
    if (wasDisabled()) { close(); return; }
    reset();
    state.revealSeen = true;
    state.hasTransition = Boolean(event.viewTransition);
    if (event.viewTransition) {
      const attempt = cycle;
      event.viewTransition.ready.then(() => {
        if (closed || cycle !== attempt) return;
        state.ready = true;
        render();
      }, error => {
        if (closed || cycle !== attempt) return;
        state.skipped = error?.name || "UnknownError";
        render();
      });
      event.viewTransition.finished.then(() => {
        if (closed || cycle !== attempt) return;
        state.finished = true;
        render();
      }, error => {
        if (closed || cycle !== attempt) return;
        state.finished = true;
        state.skipped = error?.name || "UnknownError";
        render();
      });
    }
    render();
  };
  const show = (event) => {
    if (closed) return;
    if (wasDisabled()) { close(); return; }
    // pagereveal normally precedes pageshow; only reset when it was not observed.
    if (event.persisted && !state.revealSeen) { reset(); state.loaded = true; render(); }
  };
  // Forget the previous result before a possible BFCache restore, but retain the tab opt-in.
  const hide = () => { if (!closed) reset(); };
  const animation = (event) => {
    if (closed || !state.hasTransition || event.animationName !== "page-content-enter" || event.pseudoElement !== "::view-transition-new(page-content)") return;
    if (event.type === "animationstart") state.started = true;
    if (event.type === "animationend") { state.ended = true; state.durationMs = event.elapsedTime * 1000; }
    if (event.type === "animationcancel") state.skipped = "AnimationCancelled";
    render();
  };
  const loaded = () => { if (!closed) { state.loaded = true; render(); } };
  const preference = () => { if (!closed) { state.reduced = media.matches; render(); } };
  const mount = () => {
    if (closed || panel) return;
    const candidate = document.getElementById("motion-check-panel");
    if (!candidate || !candidate.querySelector("[data-motion-check-status]") || !candidate.querySelector("[data-motion-check-detail]") || !candidate.querySelector("[data-motion-check-close]")) return;
    panel = candidate;
    panel.querySelector("[data-motion-check-close]").addEventListener("click", close);
    parseObserver?.disconnect();
    render();
  };
  const languageObserver = new MutationObserver(render);
  languageObserver.observe(root, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("pagereveal", reveal);
  window.addEventListener("pageshow", show);
  window.addEventListener("pagehide", hide);
  document.addEventListener("DOMContentLoaded", loaded, { once: true });
  for (const name of ["animationstart", "animationend", "animationcancel"]) document.addEventListener(name, animation, true);
  media.addEventListener?.("change", preference);
  mount();
  if (!panel) {
    parseObserver = new MutationObserver(mount);
    parseObserver.observe(document, { childList: true, subtree: true });
  }
}

export function motionCheckScript() {
  return `(${initializeMotionCheck.toString()})({window,document,location,history,MutationObserver,phaseFor:${motionCheckPhase.toString()}});`;
}
