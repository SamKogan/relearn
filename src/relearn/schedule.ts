import type { Mastery, Outcome, WordStat } from "./types"

export function emptyStat(): WordStat {
  return { seen: 0, clean: 0, helped: 0, misses: 0, streak: 0, last: null, lastAt: 0 }
}

export function applyResult(previous: WordStat | undefined, outcome: Outcome, now = Date.now()): WordStat {
  const stat = previous ? { ...previous } : emptyStat()
  stat.seen += 1
  stat.last = outcome
  stat.lastAt = now
  if (outcome === "clean") {
    stat.clean += 1
    stat.streak += 1
  } else if (outcome === "helped") {
    stat.helped += 1
    stat.streak = 0
  } else {
    stat.misses += 1
    stat.streak = 0
  }
  return stat
}

export function gradedCount(stat: WordStat | undefined): number {
  if (!stat) return 0
  return stat.clean + stat.helped + stat.misses
}

/** Share of answers got with no hint and no dropped choices. */
export function accuracy(stat: WordStat | undefined): number | null {
  const graded = gradedCount(stat)
  if (!stat || graded === 0) return null
  return stat.clean / graded
}

export function mastery(stat: WordStat | undefined): Mastery {
  if (!stat || stat.seen === 0) return "new"
  const percent = accuracy(stat) ?? 0
  if (stat.clean >= 3 && percent >= 0.85 && stat.last === "clean") return "solid"
  if (stat.last === "miss" || percent < 0.5) return "shaky"
  return "learning"
}

export function whyThisCard(stat: WordStat | undefined): string {
  if (!stat || stat.seen === 0) return "New word"
  if (stat.last === "miss") return "You missed this"
  if (stat.last === "helped") return "You needed help last time"
  if (mastery(stat) === "shaky") return "Still shaky"
  if (mastery(stat) === "solid") return "A quick review"
  return "Still learning"
}

function priority(stat: WordStat | undefined): number {
  if (!stat || stat.seen === 0) return 100
  const percent = accuracy(stat) ?? 0
  if (stat.last === "miss") return 92 + (1 - percent) * 8
  if (stat.last === "helped") return 74
  if (percent < 0.6 || stat.clean < 2) return 68 + (1 - percent) * 10
  if (mastery(stat) !== "solid") return 40
  return 12
}

export function pickRound<T extends { id: string }>(
  cards: readonly T[],
  stats: Readonly<Record<string, WordStat | undefined>>,
  count: number,
  random: () => number = Math.random,
): T[] {
  if (count <= 0 || cards.length === 0) return []
  const fresh: T[] = []
  const weak: T[] = []
  const firm: T[] = []
  for (const card of cards) {
    const level = mastery(stats[card.id])
    if (level === "new") fresh.push(card)
    else if (level === "solid") firm.push(card)
    else weak.push(card)
  }
  const picked: T[] = []
  const used = new Set<string>()
  const take = (bucket: readonly T[], amount: number) => {
    const ranked = bucket
      .filter((card) => !used.has(card.id))
      .map((card) => ({ card, score: priority(stats[card.id]) + random() }))
      .sort((left, right) => right.score - left.score)
    for (const item of ranked.slice(0, amount)) {
      picked.push(item.card)
      used.add(item.card.id)
    }
  }
  if (weak.length > 0 && fresh.length > 0) {
    take(weak, Math.min(Math.max(1, Math.round(count * 0.5)), count))
    take(fresh, count - picked.length)
  } else if (weak.length > 0) {
    take(weak, count)
  } else if (fresh.length > 0) {
    take(fresh, count)
  }
  if (picked.length < count) take(firm, count - picked.length)
  if (picked.length < count) take(fresh, count - picked.length)
  if (picked.length < count) take(weak, count - picked.length)
  for (let index = picked.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    const current = picked[index]
    picked[index] = picked[swap] as T
    picked[swap] = current as T
  }
  return picked
}

export function deckSummary(
  cards: readonly { id: string }[],
  stats: Readonly<Record<string, WordStat | undefined>>,
) {
  const counts: Record<Mastery, number> = { new: 0, learning: 0, shaky: 0, solid: 0 }
  let clean = 0
  let graded = 0
  for (const card of cards) {
    const stat = stats[card.id]
    counts[mastery(stat)] += 1
    if (stat) {
      clean += stat.clean
      graded += gradedCount(stat)
    }
  }
  return {
    counts,
    percent: graded === 0 ? null : clean / graded,
  }
}

export function formatPercent(value: number | null): string {
  if (value === null) return "Not started"
  return `${Math.round(value * 100)}%`
}

export function countWords(count: number): string {
  return count === 1 ? "1 word" : `${count.toLocaleString("en-US")} words`
}
