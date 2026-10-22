export type Mode = "type" | "choice"

export type Direction = "recall" | "recognize"

export type Outcome = "clean" | "helped" | "miss"

export type Mastery = "new" | "learning" | "shaky" | "solid"

export type DeckSource = "common" | "import" | "sample"

export type Card = {
  id: string
  learning: string
  known: string
  learningLang: string
  knownLang: string
}

export type Deck = {
  id: string
  title: string
  source: DeckSource
  learningLang: string
  cards: Card[]
}

export type WordStat = {
  seen: number
  clean: number
  helped: number
  misses: number
  streak: number
  last: Outcome | null
  lastAt: number
}

export type SavedCard = {
  learning: string
  known: string
  knownLang: string
}

export type SavedDeck = {
  id: string
  title: string
  learningLang: string
  savedAt: number
  cards: SavedCard[]
}

export type Store = {
  learningLang: string
  mode: Mode
  direction: Direction
  imports: SavedDeck[]
  stats: Record<string, WordStat>
}
