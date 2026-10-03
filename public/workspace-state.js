/** Navigation search uses the same case/width normalization as writing. */
export function commandMatches(text, query = "") {
  const normalize = (value) => value.normalize("NFKC").toLowerCase().trim();
  const haystack = normalize(text);
  return normalize(query).split(/\s+/u).filter(Boolean).every((word) => haystack.includes(word));
}

/** Decode only an in-page fragment, never turn search input into a URL. */
export function fragmentId(hash) {
  try { return decodeURIComponent(hash.replace(/^#/, "")); }
  catch { return ""; }
}
