function letterIndexes(answer: string): number[] {
  const indexes: number[] = []
  Array.from(answer).forEach((character, index) => {
    if (/\p{L}|\p{N}/u.test(character)) indexes.push(index)
  })
  return indexes
}

/** A hint that never prints the whole answer. Level 1 is the shape; later levels uncover more. */
export function hintFor(answer: string, level: 1 | 2 | 3): string {
  const characters = Array.from(answer)
  const indexes = letterIndexes(answer)
  if (indexes.length === 0) return "This one isn't spelled with letters."
  if (indexes.length === 1) return "It's a single letter."
  if (level === 1) {
    const words = answer.trim().split(/\s+/).filter(Boolean).length
    const wordBit = words > 1 ? `${words} words, ` : ""
    return `${wordBit}${indexes.length} letters. It starts with ${characters[indexes[0] ?? 0]}.`
  }
  const hidden = new Set<number>()
  if (level === 2) {
    const shown = new Set<number>([indexes[0] ?? 0])
    if (indexes.length > 4) shown.add(indexes[indexes.length - 1] ?? 0)
    for (const index of indexes) {
      if (!shown.has(index)) hidden.add(index)
    }
  } else {
    hidden.add(indexes[Math.floor(indexes.length / 2)] ?? 0)
  }
  const masked = characters.map((character, index) => (hidden.has(index) ? "·" : character)).join("")
  return level === 2 ? `The shape is ${masked}.` : `Almost: ${masked}.`
}
