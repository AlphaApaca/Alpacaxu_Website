import { activeHeadingIndex, readingProgress } from "./article-reader-state.js";

const reader = document.querySelector("[data-article-reader]");
const article = document.querySelector(".article-content");

if (reader && article) {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const panel = reader.querySelector("details");
  const nav = reader.querySelector("[data-reader-nav]");
  const list = nav?.querySelector("ol");
  const bar = reader.querySelector("[data-reader-bar]");
  const value = reader.querySelector("[data-reader-value]");
  const mobile = window.matchMedia("(max-width: 1050px)");
  let headings = [];
  let links = [];
  let scheduled = false;
  let current = -1;
  let lastValue = -1;

  const updateLabels = () => {
    const chinese = root.lang.toLowerCase().startsWith("zh");
    const title = chinese ? "文章目录" : "On this page";
    const progressLabel = chinese ? "阅读进度" : "Reading progress";
    reader.querySelector("[data-reader-title]").textContent = title;
    reader.querySelector("[data-reader-progress-label]").textContent = progressLabel;
    bar.setAttribute("aria-label", progressLabel);
    nav.setAttribute("aria-label", title);
    const empty = reader.querySelector("[data-reader-empty]");
    if (empty) empty.textContent = chinese ? "正文没有分节标题。" : "No section headings in this article.";
  };

  const updateOutline = () => {
    const candidates = Array.from(article.querySelectorAll("h2, h3"));
    const takenIds = new Set(Array.from(document.querySelectorAll("[id]")).map((node) => node.id));
    headings = candidates.filter((heading) => heading.getClientRects().length > 0);
    for (const [index, heading] of headings.entries()) {
      if (!heading.id) {
        let id = `article-section-${index + 1}`;
        while (takenIds.has(id)) id += "-section";
        heading.id = id;
        takenIds.add(id);
      }
      // Native hash navigation can also move keyboard focus to the heading.
      if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    }
    const existing = Array.from(list.querySelectorAll("[data-reader-link]"));
    const matches = existing.length === headings.length && existing.every((link, index) => {
      try { return decodeURIComponent(link.hash.slice(1)) === headings[index].id; }
      catch { return false; }
    });
    if (!matches) {
      list.replaceChildren(...headings.map((heading) => {
        const item = document.createElement("li");
        item.className = "reader-item";
        item.dataset.depth = heading.tagName.slice(1);
        const link = document.createElement("a");
        link.dataset.readerLink = "";
        link.href = `#${encodeURIComponent(heading.id)}`;
        item.append(link);
        return item;
      }));
    }
    links = Array.from(list.querySelectorAll("[data-reader-link]"));
    links.forEach((link, index) => { link.textContent = headings[index].textContent.trim(); });
    nav.hidden = headings.length === 0;
    current = -1;
    updateLabels();
    schedule();
  };

  const update = () => {
    scheduled = false;
    const headerOffset = Math.ceil(header?.getBoundingClientRect().height ?? 68) + 16;
    root.style.setProperty("--reader-header-offset", `${headerOffset}px`);
    const compactHeight = mobile.matches ? panel.querySelector("summary").getBoundingClientRect().height + 16 : 0;
    const offset = headerOffset + compactHeight;
    root.style.setProperty("--reader-section-offset", `${offset + 8}px`);
    const articleRect = article.getBoundingClientRect();
    const articleTop = articleRect.top + window.scrollY;
    const articleBottom = articleRect.bottom + window.scrollY;
    const percent = readingProgress({
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
      articleTop,
      articleBottom,
      readingOffset: offset
    });
    if (percent !== lastValue) {
      value.textContent = `${percent}%`;
      bar.value = percent;
      bar.textContent = `${percent}%`;
      lastValue = percent;
    }
    const positions = headings.map((heading) => heading.getBoundingClientRect().top + window.scrollY);
    const atDocumentEnd = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    let selectedIndex = -1;
    if (document.documentElement.scrollHeight <= window.innerHeight + 2 && location.hash) {
      // An entirely visible short page cannot scroll at all: honor its native hash selection.
      try { selectedIndex = headings.findIndex((heading) => heading.id === decodeURIComponent(location.hash.slice(1))); }
      catch { /* An invalid external hash has no selected section. */ }
    }
    const next = activeHeadingIndex(positions, window.scrollY + offset + 10, { atDocumentEnd, selectedIndex });
    if (next !== current) {
      links.forEach((link, index) => {
        if (index === next) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      current = next;
    }
  };

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }

  const setPanelMode = () => { panel.open = !mobile.matches; schedule(); };
  list.addEventListener("click", (event) => {
    const link = event.target.closest("[data-reader-link]");
    if (link && mobile.matches && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      // Close before the native anchor action so its destination uses the compact layout.
      panel.open = false;
    }
  });
  panel.addEventListener("toggle", schedule);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("pageshow", schedule);
  mobile.addEventListener("change", setPanelMode);
  new MutationObserver(updateOutline).observe(article, { childList: true, characterData: true, subtree: true });
  new MutationObserver(updateLabels).observe(root, { attributes: true, attributeFilter: ["lang"] });
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(article);
    if (header) resizeObserver.observe(header);
  }
  article.addEventListener("load", schedule, true);
  article.addEventListener("toggle", updateOutline, true);
  document.fonts?.ready.then(schedule);
  updateOutline();
  setPanelMode();
  reader.querySelector("[data-reader-progress]").hidden = false;
  value.hidden = false;
}
