import { matchesWriting, normalizeSearch, readWritingFilters } from "./writing.mjs";

// Serialized into the head: no imports, network requests, timers, or body hiding.
// Parser mutations run in a microtask before rendering, including streamed HTML.
export function initializeInterface({ document, storage, matchMedia, MutationObserver, location, writingManifest = [], matchesWriting, normalizeSearch, readWritingFilters }) {
  const root = document.documentElement;
  const read = (key) => { try { return storage?.getItem(key); } catch { return null; } };
  const savedTheme = read("alpaca-theme");
  const language = read("alpaca-lang") === "zh" ? "zh" : "en";
  root.dataset.theme = savedTheme === "dark" || savedTheme === "light"
    ? savedTheme : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  root.lang = language === "zh" ? "zh-CN" : "en";
  root.dataset.lang = language;
  root.dataset.uiJs = "true";
  const filters = readWritingFilters(location.search);
  const count = writingManifest.filter((post) => matchesWriting(post, filters)).length;
  const pendingButtons = new WeakSet();
  const text = (element, value) => {
    if (value !== undefined && element.textContent !== value) element.textContent = value;
  };
  const attribute = (element, name, value) => {
    if (value !== undefined && element.getAttribute(name) !== value) element.setAttribute(name, value);
  };
  const localize = (element) => {
    if (!element?.getAttribute || element.closest?.("article.article-content[lang], script, style")) return;
    text(element, element.getAttribute(`data-workspace-${language}`) ?? undefined);
    for (const [key, name] of [
      ["aria", "aria-label"], ["placeholder", "placeholder"],
      ["alt", "alt"], ["title", "title"],
    ]) {
      attribute(element, name, element.getAttribute(`data-workspace-${key}-${language}`) ?? undefined);
    }
    if (element.matches(".lang-toggle")) {
      text(element, language === "zh" ? "EN" : "中文");
      const action = language === "zh" ? "Switch to English" : "切换到中文";
      attribute(element, "aria-label", action);
      attribute(element, "title", action);
      if (!pendingButtons.has(element)) {
        pendingButtons.add(element);
        element.disabled = true;
        element.hidden = false;
      }
    }
    const iso = element.getAttribute("data-interface-date") !== null && element.getAttribute("datetime");
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const date = new Date(`${iso}T00:00:00Z`);
      if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso) text(element, new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
      }).format(date));
    }
    if (element.hasAttribute("data-reader-title")) text(element, language === "zh" ? "文章目录" : "On this page");
    if (element.hasAttribute("data-reader-progress-label")) text(element, language === "zh" ? "阅读进度" : "Reading progress");
    if (element.hasAttribute("data-reader-empty")) text(element, language === "zh" ? "正文没有分节标题。" : "No section headings in this article.");
    if (element.hasAttribute("data-reader-nav")) attribute(element, "aria-label", language === "zh" ? "文章目录" : "On this page");
    if (element.hasAttribute("data-reader-bar")) attribute(element, "aria-label", language === "zh" ? "阅读进度" : "Reading progress");
    if (element.hasAttribute("data-localized-zh")) attribute(element, "content", element.getAttribute(`data-localized-${language}`));
    if (element.hasAttribute("data-writing-post")) {
      element.hidden = !matchesWriting({ category: element.dataset.category, tags: JSON.parse(element.dataset.tags), searchText: element.dataset.search }, filters);
    }
    if (element.id === "writingResults") text(element, language === "zh"
      ? `显示 ${count} / ${writingManifest.length} 篇文章`
      : `Showing ${count} of ${writingManifest.length} ${writingManifest.length === 1 ? "article" : "articles"}`);
    if (element.id === "writingEmpty") element.hidden = count > 0;
    if (element.id === "writingEmptyHint") text(element, filters.category === "essay" && !filters.q && !filters.tag
      ? language === "zh" ? "这里还没有已发布的杂文。留一些位置，给以后的随想。" : "No published essays yet. Leaving a little room for future thoughts."
      : language === "zh" ? "换个关键词，或清除分类和标签试试。" : "Try another keyword, or clear the category and tag filters.");
    if (element.closest?.("[data-writing-index]") && element.matches("input[name=q], input[name=category]")) {
      element.value = element.name === "q" ? filters.q : filters.category;
    }
    if (element.closest?.(".writing-categories") && element.hasAttribute("data-writing-category")) {
      if (element.dataset.writingCategory === filters.category) attribute(element, "aria-current", "true");
      else element.removeAttribute("aria-current");
    }
  };
  const visit = (node) => {
    localize(node);
    node?.querySelectorAll?.("[data-workspace-zh], [data-workspace-aria-zh], [data-workspace-placeholder-zh], [data-workspace-alt-zh], [data-workspace-title-zh], .lang-toggle, [data-interface-date], [data-reader-title], [data-reader-progress-label], [data-reader-empty], [data-reader-nav], [data-reader-bar], [data-localized-zh], [data-writing-post], #writingResults, #writingEmpty, #writingEmptyHint, [data-writing-category], input[name=q], input[name=category]").forEach(localize);
  };
  const restoreTag = () => {
    const select = document.querySelector("#writingTag");
    if (!select) return;
    let matching = [...select.options].find((option) => !option.hasAttribute("data-transient") && normalizeSearch(option.value) === normalizeSearch(filters.tag));
    if (matching) select.querySelectorAll("[data-transient]").forEach((option) => option.remove());
    else if (filters.tag) {
      matching = select.querySelector("[data-transient]");
      if (!matching) {
        matching = document.createElement("option");
        matching.setAttribute("data-transient", "true");
        matching.value = filters.tag;
        text(matching, language === "zh" ? `${filters.tag}（未收录）` : `${filters.tag} (not indexed)`);
        select.append(matching);
      }
    }
    if (matching) select.value = matching.value;
  };
  const title = root.getAttribute(`data-page-title-${language}`);
  if (title) document.title = title;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      localize(record.target.nodeType === 1 ? record.target : record.target.parentElement);
      for (const node of record.addedNodes) visit(node.nodeType === 1 ? node : node.parentElement);
    }
    restoreTag();
  });
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  visit(root);
  restoreTag();
  // Stop when parsing finishes, before deferred modules take ownership of live
  // controls. A late dependency must not let this bootstrap overwrite user input.
  const finish = () => {
    if (document.readyState === "loading") return;
    visit(root);
    restoreTag();
    observer.disconnect();
    document.removeEventListener("readystatechange", finish);
  };
  document.addEventListener("readystatechange", finish);
  finish();
  return { visit, observer, language };
}

/** @param {{ writingManifest?: { category: string, tags: string[], searchText: string }[] }} [options] */
export function firstPaintScript({ writingManifest = [] } = {}) {
  const json = JSON.stringify({ writingManifest }).replaceAll("<", "\\u003c");
  return `(() => { const normalizeSearch = ${normalizeSearch}; const matchesWriting = ${matchesWriting}; const readWritingFilters = ${readWritingFilters}; const data = ${json}; (${initializeInterface})({ document, storage: (() => { try { return localStorage; } catch { return null; } })(), matchMedia: window.matchMedia.bind(window), MutationObserver, location, matchesWriting, normalizeSearch, readWritingFilters, ...data }); })();`;
}
