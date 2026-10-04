import ts from "typescript";

// The old homepage remains a raw evidence bridge. Read its existing dictionary as
// static data at build time, never execute its browser script or fetch it at runtime.
export function evidenceCopy(source, markup) {
  if (/\bdata-i18n-html\s*=/.test(markup)) throw new Error("HTML translation is unsupported; use text-only bilingual leaf nodes.");
  const file = ts.createSourceFile("legacy-copy.js", source, ts.ScriptTarget.Latest, true);
  let dictionary;
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    dictionary = statement.declarationList.declarations.find((item) =>
      ts.isIdentifier(item.name) && item.name.text === "translations")?.initializer ?? dictionary;
  }
  const literal = (node) => {
    if (node && ts.isStringLiteral(node)) return node.text;
    if (!node || !ts.isObjectLiteralExpression(node)) throw new Error("Evidence copy must contain only static strings and objects.");
    const result = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
        throw new Error("Evidence copy cannot execute computed properties or expressions.");
      }
      result[property.name.text] = literal(property.initializer);
    }
    return result;
  };
  const all = literal(dictionary);
  const keys = new Set([...markup.matchAll(/\bdata-i18n(?:-placeholder|-alt|-title|-aria-label)?="([^"]+)"/g)].map((match) => match[1]));
  return Object.fromEntries(["zh", "en"].map((language) => [language,
    Object.fromEntries([...keys].map((key) => {
      if (typeof all[language]?.[key] !== "string") throw new Error(`Missing evidence copy: ${language}.${key}`);
      return [key, all[language][key]];
    }))]));
}

// Enrich the evidence bridge with the same declarative copy as the new pages.
// Values stay in HTML attributes, so first paint and later clicks use one source.
export function evidenceMarkup(source, markup) {
  const copy = evidenceCopy(source, markup);
  const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return markup.replace(/<[a-z][a-z\d:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*?>/gi, (tag) => {
    const attributes = [...tag.matchAll(/\bdata-i18n(-placeholder|-alt|-title|-aria-label)?="([^"]+)"/g)];
    const additions = attributes.flatMap(([, suffix, key]) => {
      const target = suffix === "-aria-label" ? "-aria" : suffix ?? "";
      return ["zh", "en"].map((language) => ` data-workspace${target}-${language}="${escape(copy[language][key])}"`);
    }).join("");
    return tag.replace(/\s*\/?>$/, (ending) => `${additions}${ending}`);
  });
}
