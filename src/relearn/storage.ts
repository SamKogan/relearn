import { cardKey } from "./cards"
import { languageById } from "./languages"
import type { Deck, SavedDeck, Store, WordStat } from "./types"

const KEY = "relearn:v1"

export function emptyStore(): Store {
  return {
    learningLang: "he",
    mode: "type",
    direction: "recognize",
    imports: [],
    stats: {},
  }
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore()
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return emptyStore()
    const record = parsed as Partial<Store>
    const learningLang = languageById(record.learningLang) ? record.learningLang ?? "he" : "he"
    return {
      learningLang,
      mode: record.mode === "choice" ? "choice" : "type",
      direction: record.direction === "recall" ? "recall" : "recognize",
      imports: Array.isArray(record.imports) ? record.imports.filter(isSavedDeck) : [],
      stats: readStats(record.stats),
    }
  } catch {
    return emptyStore()
  }
}

export function saveStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // The list still works for this visit if the browser refuses storage.
  }
}

export function savedToDeck(saved: SavedDeck): Deck {
  return {
    id: saved.id,
    title: saved.title,
    source: saved.id.startsWith("sample:") ? "sample" : "import",
    learningLang: saved.learningLang,
    cards: saved.cards.map((card) => ({
      id: cardKey(saved.learningLang, card.learning, card.known),
      learning: card.learning,
      known: card.known,
      learningLang: saved.learningLang,
      knownLang: card.knownLang,
    })),
  }
}

export function upsertImport(store: Store, deck: Deck): Store {
  const saved: SavedDeck = {
    id: deck.id,
    title: deck.title,
    learningLang: deck.learningLang,
    savedAt: Date.now(),
    cards: deck.cards.map((card) => ({
      learning: card.learning,
      known: card.known,
      knownLang: card.knownLang,
    })),
  }
  return {
    ...store,
    imports: [saved, ...store.imports.filter((item) => item.id !== saved.id)],
  }
}

export function removeImport(store: Store, id: string): Store {
  return { ...store, imports: store.imports.filter((item) => item.id !== id) }
}

function isSavedDeck(value: unknown): value is SavedDeck {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<SavedDeck>
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.learningLang === "string" &&
    typeof record.savedAt === "number" &&
    Array.isArray(record.cards) &&
    record.cards.every(isSavedCard)
  )
}

function isSavedCard(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<SavedDeck["cards"][number]>
  return typeof record.learning === "string" && typeof record.known === "string" && typeof record.knownLang === "string"
}

function readStats(value: unknown): Record<string, WordStat> {
  if (!value || typeof value !== "object") return {}
  const stats: Record<string, WordStat> = {}
  for (const [id, stat] of Object.entries(value)) {
    if (!stat || typeof stat !== "object") continue
    const record = stat as Partial<WordStat>
    if (
      typeof record.seen !== "number" ||
      typeof record.clean !== "number" ||
      typeof record.helped !== "number" ||
      typeof record.misses !== "number"
    ) {
      continue
    }
    stats[id] = {
      seen: record.seen,
      clean: record.clean,
      helped: record.helped,
      misses: record.misses,
      streak: typeof record.streak === "number" ? record.streak : 0,
      last: record.last === "clean" || record.last === "helped" || record.last === "miss" ? record.last : null,
      lastAt: typeof record.lastAt === "number" ? record.lastAt : 0,
    }
  }
  return stats
}
