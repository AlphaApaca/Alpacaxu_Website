/** Progress ends at the article body, not at comments or the page footer. */
export function readingProgress({ scrollY, viewportHeight, articleTop, articleBottom, readingOffset }) {
  const numbers = [scrollY, viewportHeight, articleTop, articleBottom, readingOffset];
  if (!numbers.every(Number.isFinite) || viewportHeight <= 0 || articleBottom <= articleTop) return 0;
  const start = articleTop - readingOffset;
  const end = articleBottom - viewportHeight;
  if (end <= start) return articleBottom <= scrollY + viewportHeight ? 100 : 0;
  return Math.round(Math.max(0, Math.min(1, (scrollY - start) / (end - start))) * 100);
}

/** The last heading crossed by the reading line is the current section. */
export function activeHeadingIndex(positions, readingLine, { atDocumentEnd = false, selectedIndex = -1 } = {}) {
  if (!positions.length || !Number.isFinite(readingLine)) return -1;
  if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < positions.length) return selectedIndex;
  if (atDocumentEnd) return positions.length - 1;
  let current = 0;
  for (let index = 0; index < positions.length; index += 1) {
    if (positions[index] <= readingLine + 2) current = index;
    else break;
  }
  return current;
}
