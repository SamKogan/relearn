import { useState } from "react"
import { commonDeck, SAMPLE_SHEET } from "./decks"
import { SheetGuide } from "./Guide"
import { languageById, languages } from "./languages"
import { countWords, deckSummary, formatPercent } from "./schedule"
import { savedToDeck } from "./storage"
import type { Deck, Store } from "./types"
import { Mark } from "./Mark"

type HomeProps = {
  store: Store
  onLearningLang: (id: string) => void
  onImport: () => void
  onSample: () => void
  onPractice: (deck: Deck) => void
  onWords: (deck: Deck) => void
  onRemove: (id: string) => void
}

export function Home({ store, onLearningLang, onImport, onSample, onPractice, onWords, onRemove }: HomeProps) {
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)
  const learning = languageById(store.learningLang) ?? languages[0]
  const common = commonDeck(store.learningLang)
  const commonSummary = common ? deckSummary(common.cards, store.stats) : null
  const hebrew = commonDeck("he")

  return (
    <div className="shell home">
      <header className="mast">
        <div className="brand">
          <Mark />
          <div>
            <h1>ReLearn</h1>
            <p>The words you saved, until they actually stick.</p>
          </div>
        </div>
      </header>

      <label className="lang-row">
        I'm learning
        <select value={store.learningLang} onChange={(event) => onLearningLang(event.target.value)}>
          {languages.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </select>
      </label>

      {store.imports.length > 0 && (
        <section className="lists">
          <h2>Jump back in</h2>
          {store.imports.map((saved) => {
            const deck = savedToDeck(saved)
            const summary = deckSummary(deck.cards, store.stats)
            const name = languageById(saved.learningLang)?.name ?? saved.learningLang
            return (
              <article key={saved.id} className="deck-card">
                <div>
                  <h3>{saved.title}</h3>
                  <p>
                    {name} · {countWords(deck.cards.length)} ·{" "}
                    {summary.percent === null ? "not practiced yet" : `${formatPercent(summary.percent)} remembered`}
                  </p>
                  <Meter percent={summary.percent} />
                </div>
                <div className="deck-actions">
                  <button type="button" className="primary" onClick={() => onPractice(deck)}>
                    Practice
                  </button>
                  <button type="button" className="ghost" onClick={() => onWords(deck)}>
                    Scores
                  </button>
                  {pendingRemove === saved.id ? (
                    <button type="button" className="texty danger" onClick={() => { onRemove(saved.id); setPendingRemove(null) }}>
                      Remove this list
                    </button>
                  ) : (
                    <button type="button" className="texty" onClick={() => setPendingRemove(saved.id)}>
                      Remove
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      <section className="path-grid">
        <article className="path">
          <p className="kicker">From your stars</p>
          <h2>Saved translations</h2>
          <p>
            Star a word in Google Translate, then bring the sheet here. You'll practice those words, not someone
            else's list.
          </p>
          <button type="button" className="primary" onClick={onImport}>
            Bring my list
          </button>
          {store.learningLang === "he" && (
            <button type="button" className="texty" onClick={onSample}>
              Try {SAMPLE_SHEET.length} sample favorites
            </button>
          )}
        </article>

        <article className="path">
          <p className="kicker">No sheet yet</p>
          {common && commonSummary ? (
            <>
              <h2>1,000 common Hebrew words</h2>
              <p>The words you'll meet constantly, when you don't have a saved list yet.</p>
              <p className="fine">
                {commonSummary.percent === null
                  ? `${countWords(common.cards.length)} · not started`
                  : `${formatPercent(commonSummary.percent)} remembered · ${commonSummary.counts.solid} solid · ${commonSummary.counts.shaky} shaky · ${commonSummary.counts.new} new`}
              </p>
              <Meter percent={commonSummary.percent} />
              <button type="button" className="primary" onClick={() => onPractice(common)}>
                Practice common words
              </button>
              <button type="button" className="texty" onClick={() => onWords(common)}>
                See scores
              </button>
            </>
          ) : (
            <>
              <h2>Common words</h2>
              <p>
                The built-in list right now is Hebrew: 1,000 common words. For {learning?.name}, bring your saved
                translations.
              </p>
              {hebrew && (
                <button type="button" className="primary" onClick={() => { onLearningLang("he"); onPractice(hebrew) }}>
                  Practice the Hebrew list
                </button>
              )}
            </>
          )}
        </article>
      </section>

      <details className="guide-fold" open={store.imports.length === 0}>
        <summary>How to get your starred words</summary>
        <SheetGuide />
      </details>

      <p className="footnote">
        A round is 10 words, weighted toward new ones and ones you've missed. A word counts as remembered only when
        you get it with no hint and no dropped choices. Scores stay in this browser.
      </p>
    </div>
  )
}

function Meter({ percent }: { percent: number | null }) {
  return (
    <span className="meter" aria-hidden="true">
      <i style={{ width: `${Math.round((percent ?? 0) * 100)}%` }} />
    </span>
  )
}
