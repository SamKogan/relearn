import { useMemo, useState } from "react"
import { languageById } from "./languages"
import { accuracy, countWords, formatPercent, mastery } from "./schedule"
import type { Deck, Mastery, WordStat } from "./types"
import { Mark } from "./Mark"

const FILTERS: Array<Mastery | "all"> = ["all", "shaky", "learning", "new", "solid"]

const RANK: Record<Mastery, number> = { shaky: 0, learning: 1, new: 2, solid: 3 }

type WordsProps = {
  deck: Deck
  stats: Record<string, WordStat>
  onPractice: () => void
  onHome: () => void
}

export function Words({ deck, stats, onPractice, onHome }: WordsProps) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Mastery | "all">("all")
  const learning = languageById(deck.learningLang)

  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en")
    return deck.cards
      .map((card) => {
        const stat = stats[card.id]
        return { card, stat, level: mastery(stat), percent: accuracy(stat) }
      })
      .filter((row) => (filter === "all" ? true : row.level === filter))
      .filter((row) => {
        if (!needle) return true
        return (
          row.card.learning.toLocaleLowerCase("en").includes(needle) ||
          row.card.known.toLocaleLowerCase("en").includes(needle)
        )
      })
      .sort((left, right) => {
        const byLevel = RANK[left.level] - RANK[right.level]
        if (byLevel !== 0) return byLevel
        return (left.percent ?? -1) - (right.percent ?? -1)
      })
  }, [deck.cards, filter, query, stats])

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="brand-button" onClick={onHome}>
          <Mark />
          <span>ReLearn</span>
        </button>
        <button type="button" className="primary" onClick={onPractice}>
          Practice
        </button>
      </header>
      <section className="words">
        <h2>{deck.title}</h2>
        <p className="lede">
          {countWords(deck.cards.length)}. The percent is how often you got the word with no hint and no dropped
          choices. Shaky words are listed first, because those are the ones to practice.
        </p>
        <label className="search">
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A word in either language" />
        </label>
        <div className="segments" role="group" aria-label="Filter">
          {FILTERS.map((item) => (
            <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>
              {item === "all" ? "All" : labelFor(item)}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="empty">Nothing matches.</p>
        ) : (
          <ul className="word-list">
            {rows.map((row) => (
              <li key={row.card.id}>
                <div className="word-main">
                  <span className="word" dir={learning?.dir} lang={learning?.speech}>
                    {row.card.learning}
                  </span>
                  <span className="gloss">{row.card.known}</span>
                </div>
                <div className="word-score">
                  <span className={`pill ${row.level}`}>{labelFor(row.level)}</span>
                  <span className="percent">{row.percent === null ? "—" : formatPercent(row.percent)}</span>
                  <span className="meter" aria-hidden="true">
                    <i style={{ width: `${Math.round((row.percent ?? 0) * 100)}%` }} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function labelFor(level: Mastery): string {
  if (level === "new") return "New"
  if (level === "learning") return "Learning"
  if (level === "shaky") return "Shaky"
  return "Solid"
}
