export function copyTag<T extends { related?: readonly T[] }>(tag: T): T {
  const copy = { ...tag }

  if (tag.related !== undefined) {
    copy.related = tag.related.map((related) => copyTag(related))
  }

  return copy
}
