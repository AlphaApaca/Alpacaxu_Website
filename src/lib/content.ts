const categoryLabels: Record<string, string> = {
  "learning-log": "学习日志 · Learning Log",
  note: "笔记 · Note",
  essay: "杂文 · Essay"
};

export function categoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

export function postPath(permalink: string) {
  return `/writing/${permalink}/`;
}
