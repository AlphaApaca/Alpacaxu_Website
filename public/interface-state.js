export function interfaceLanguage(value) {
  return String(value ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function preferredInterfaceLanguage(storage) {
  try {
    const saved = storage?.getItem("alpaca-lang");
    return saved === "zh" || saved === "en" ? saved : "en";
  } catch { return "en"; }
}

export function languageToggleLabel(language) {
  return interfaceLanguage(language) === "zh"
    ? { text: "EN", action: "Switch to English" }
    : { text: "中文", action: "切换到中文" };
}

export function interfaceDate(value, language) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return value ?? "";
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return value;
  return new Intl.DateTimeFormat(interfaceLanguage(language) === "zh" ? "zh-CN" : "en", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(date);
}
