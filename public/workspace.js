import { commandMatches, fragmentId } from "./workspace-state.js";
import { interfaceLanguage, interfaceDate, languageToggleLabel } from "./interface-state.js";

const root = document.documentElement;
const chinese = () => interfaceLanguage(root.dataset.lang ?? root.lang) === "zh";
const copy = () => {
  const language = chinese() ? "zh" : "en";
  document.querySelectorAll("[data-workspace-zh]").forEach((element) => {
    element.textContent = element.getAttribute(`data-workspace-${language}`) ?? element.textContent;
  });
  for (const [key, attribute] of [["aria", "aria-label"], ["placeholder", "placeholder"], ["alt", "alt"], ["title", "title"]]) {
    document.querySelectorAll(`[data-workspace-${key}-zh]`).forEach((element) => {
      element.setAttribute(attribute, element.getAttribute(`data-workspace-${key}-${language}`) ?? "");
    });
  }
  const title = root.getAttribute(`data-page-title-${language}`);
  if (title) {
    document.title = title;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  }
  document.querySelectorAll("[data-localized-zh]").forEach((meta) => {
    meta.setAttribute("content", meta.getAttribute(`data-localized-${language}`) ?? "");
  });
  document.querySelectorAll("[data-interface-date]").forEach((element) => {
    element.textContent = interfaceDate(element.getAttribute("datetime"), language);
  });
  const toggle = languageToggleLabel(language);
  document.querySelectorAll(".lang-toggle").forEach((button) => {
    button.textContent = toggle.text;
    button.setAttribute("aria-label", toggle.action);
    button.setAttribute("title", toggle.action);
    button.hidden = false;
    button.disabled = false;
  });
  document.querySelectorAll("[data-workspace-article-open]").forEach((element) => {
    const title = element.closest("article")?.querySelector("h3")?.textContent ?? "";
    element.setAttribute("aria-label", `${chinese() ? "阅读" : "Read"}: ${title}`);
  });
  window.dispatchEvent(new CustomEvent("site:language-change", { detail: { language } }));
};
copy();

// All pages share one handler; the old homepage browser script is not loaded.
document.querySelectorAll(".lang-toggle").forEach((button) => button.addEventListener("click", () => {
  const next = chinese() ? "en" : "zh";
  try { localStorage.setItem("alpaca-lang", next); } catch { /* Switching also works without storage. */ }
  root.lang = next === "zh" ? "zh-CN" : "en";
  root.dataset.lang = next;
}));

const map = document.querySelector("[data-workspace-map]");
if (map) {
  const nodes = [...map.querySelectorAll("[data-workspace-topic]")];
  const panels = [...map.querySelectorAll("[data-workspace-panel]")];
  const select = (node) => {
    nodes.forEach((item) => {
      const selected = item === node;
      item.setAttribute("aria-pressed", String(selected));
      item.removeAttribute("aria-current");
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.workspacePanel !== node.dataset.workspaceTopic; });
  };
  nodes.forEach((node) => {
    node.setAttribute("role", "button");
    node.setAttribute("aria-pressed", String(node.dataset.workspaceTopic === "planning"));
    node.removeAttribute("aria-current");
    node.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(node);
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === " ") { event.preventDefault(); select(node); }
    });
  });
}

// Old bookmarked sections can now live inside native evidence disclosures.
const revealFragment = () => {
  const id = fragmentId(location.hash);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  let ancestor = target.parentElement;
  let revealed = false;
  while (ancestor) {
    if (ancestor instanceof HTMLDetailsElement && !ancestor.open) { ancestor.open = true; revealed = true; }
    ancestor = ancestor.parentElement;
  }
  if (revealed) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
};
revealFragment();
window.addEventListener("hashchange", revealFragment);

const dialog = document.querySelector("#site-command");
const trigger = document.querySelector(".workspace-command-trigger");
if (dialog instanceof HTMLDialogElement && trigger && typeof dialog.showModal === "function") {
  const search = dialog.querySelector("input");
  const options = [...dialog.querySelectorAll("[data-command-result]")];
  const status = dialog.querySelector("[data-command-status]");
  const empty = dialog.querySelector("[data-command-empty]");
  const filter = () => {
    let count = 0;
    options.forEach((option) => {
      option.hidden = !commandMatches(`${option.dataset.commandSearch} ${option.textContent}`, search.value);
      if (!option.hidden) count += 1;
    });
    empty.hidden = count > 0;
    status.textContent = chinese() ? `${count} 个入口` : `${count} destinations`;
  };
  const open = () => {
    if (dialog.open) return;
    search.value = "";
    filter();
    dialog.showModal();
    trigger.setAttribute("aria-expanded", "true");
    search.focus();
  };
  trigger.hidden = false;
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", open);
  search.addEventListener("input", filter);
  dialog.addEventListener("close", () => { trigger.setAttribute("aria-expanded", "false"); });
  options.forEach((option) => option.addEventListener("click", () => dialog.close()));
  document.addEventListener("keydown", (event) => {
    // Search fields can consume Escape to clear text; the documented shortcut closes the menu.
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      dialog.close();
      trigger.focus();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.repeat) {
      event.preventDefault();
      if (dialog.open) { dialog.close(); trigger.focus(); } else open();
    }
  });
  window.addEventListener("pageshow", () => { if (dialog.open) dialog.close(); });
  new MutationObserver(() => { copy(); if (dialog.open) filter(); }).observe(root, { attributes: true, attributeFilter: ["data-lang", "lang"] });
} else {
  new MutationObserver(copy).observe(root, { attributes: true, attributeFilter: ["data-lang", "lang"] });
}
