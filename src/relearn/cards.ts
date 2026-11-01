import { foldKey, senses } from "./grade"
import type { Card, Direction } from "./types"

export function cardKey(learningLang: string, learning: string, known: string): string {
  return `${learningLang}|${foldKey(learning)}|${foldKey(known)}`
}

export function pairsToCards(
  pairs: readonly (readonly [string, string])[],
  learningLang: string,
  knownLang: string,
): Card[] {
  const cards: Card[] = []
  const seen = new Set<string>()
  for (const [learning, known] of pairs) {
    const card: Card = {
      id: cardKey(learningLang, learning, known),
      learning,
      known,
      learningLang,
      knownLang,
    }
    if (seen.has(card.id)) continue
    seen.add(card.id)
    cards.push(card)
  }
  return cards
}

/** Keep every saved card, then append pairs that are not already in the list. */
export function mergeCards(existing: readonly Card[], incoming: readonly Card[]): Card[] {
  const seen = new Set(existing.map((card) => card.id))
  const cards = [...existing]
  for (const card of incoming) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    cards.push(card)
  }
  return cards
}

export type Face = {
  prompt: string
  promptLang: string
  answer: string
  answerLang: string
}

export function faced(card: Card, direction: Direction): Face {
  if (direction === "recall") {
    return {
      prompt: senses(card.known)[0] ?? card.known,
      promptLang: card.knownLang,
      answer: card.learning,
      answerLang: card.learningLang,
    }
  }
  return {
    prompt: card.learning,
    promptLang: card.learningLang,
    answer: card.known,
    answerLang: card.knownLang,
  }
}

export function answerForms(card: Card, direction: Direction): { main: string; also: string[] } {
  const full = direction === "recall" ? card.learning : card.known
  const [main, ...also] = senses(full)
  return { main: main ?? full, also }
}

export function choiceOptions(
  card: Card,
  cards: readonly Card[],
  direction: Direction,
  random: () => number = Math.random,
): string[] {
  const answer = faced(card, direction).answer
  const answerKey = foldKey(senses(answer)[0] ?? answer)
  const pool = new Map<string, string>()
  for (const other of cards) {
    const text = faced(other, direction).answer
    const primary = senses(text)[0] ?? text
    const key = foldKey(primary)
    if (!primary || key === answerKey || pool.has(key)) continue
    pool.set(key, primary)
  }
  const target = Array.from(answer).length
  const near = [...pool.values()]
    .sort(
      (left, right) =>
        Math.abs(Array.from(left).length - target) - Math.abs(Array.from(right).length - target),
    )
    .slice(0, 16)
  shuffle(near, random)
  const options = [senses(answer)[0] ?? answer, ...near.slice(0, 3)]
  shuffle(options, random)
  return options
}

export function takeTwo<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const pool = [...items]
  const picked: T[] = []
  for (let count = 0; count < 2 && pool.length > 0; count++) {
    const index = Math.floor(random() * pool.length)
    const [removed] = pool.splice(index, 1)
    if (removed) picked.push(removed)
  }
  return picked
}

function shuffle(items: string[], random: () => number) {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    const current = items[index]
    items[index] = items[swap] as string
    items[swap] = current as string
  }
}
