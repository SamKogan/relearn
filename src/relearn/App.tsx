import { useEffect, useState } from "react"
import { mergeCards } from "./cards"
import { sampleDeck } from "./decks"
import { Home } from "./Home"
import { ImportSheet } from "./Import"
import { Practice } from "./Practice"
import { applyResult } from "./schedule"
import { loadStore, removeImport, savedToDeck, saveStore, upsertImport } from "./storage"
import type { Card, Deck, Direction, Mode, Outcome, Store } from "./types"
import { Words } from "./Words"

type Screen =
  | { name: "home" }
  | { name: "import" }
  | { name: "practice"; deck: Deck }
  | { name: "words"; deck: Deck }

export default function App() {
  const [store, setStore] = useState(loadStore)
  const [screen, setScreen] = useState<Screen>({ name: "home" })

  useEffect(() => {
    document.title = "ReLearn"
    document.documentElement.lang = "en"
    document.documentElement.dir = "ltr"
  }, [])

  function patch(recipe: (previous: Store) => Store) {
    setStore((previous) => {
      const next = recipe(previous)
      saveStore(next)
      return next
    })
  }

  function practice(deck: Deck) {
    setScreen({ name: "practice", deck })
  }

  function openImport(learningLang?: string) {
    if (learningLang && learningLang !== store.learningLang) {
      patch((previous) => ({ ...previous, learningLang }))
    }
    setScreen({ name: "import" })
  }

  function startImport(cards: Card[], title: string) {
    const id = `import:${store.learningLang}`
    const previous = store.imports.find((item) => item.id === id)
    const existing = previous ? savedToDeck(previous).cards : []
    const deck: Deck = {
      id,
      title: previous?.title ?? title,
      source: "import",
      learningLang: store.learningLang,
      cards: existing.length > 0 ? mergeCards(existing, cards) : cards,
    }
    patch((previousStore) => upsertImport(previousStore, deck))
    setScreen(existing.length > 0 ? { name: "home" } : { name: "practice", deck })
  }

  function startSample() {
    const deck = sampleDeck()
    patch((previous) => upsertImport(previous, deck))
    setScreen({ name: "practice", deck })
  }

  const savedImport = store.imports.find((item) => item.id === `import:${store.learningLang}`)

  return (
    <div className="relearn">
      {screen.name === "home" && (
        <Home
          store={store}
          onLearningLang={(id) => patch((previous) => ({ ...previous, learningLang: id }))}
          onImport={openImport}
          onSample={startSample}
          onPractice={practice}
          onWords={(deck) => setScreen({ name: "words", deck })}
          onRemove={(id) => patch((previous) => removeImport(previous, id))}
        />
      )}
      {screen.name === "import" && (
        <ImportSheet
          learningLang={store.learningLang}
          savedCards={savedImport ? savedToDeck(savedImport).cards : []}
          onCancel={() => setScreen({ name: "home" })}
          onStart={startImport}
        />
      )}
      {screen.name === "practice" && (
        <Practice
          deck={screen.deck}
          stats={store.stats}
          mode={store.mode}
          direction={store.direction}
          onMode={(mode: Mode) => patch((previous) => ({ ...previous, mode }))}
          onDirection={(direction: Direction) => patch((previous) => ({ ...previous, direction }))}
          onResult={(card, outcome: Outcome) =>
            patch((previous) => ({
              ...previous,
              stats: {
                ...previous.stats,
                [card.id]: applyResult(previous.stats[card.id], outcome),
              },
            }))
          }
          onHome={() => setScreen({ name: "home" })}
          onWords={() => setScreen({ name: "words", deck: screen.deck })}
        />
      )}
      {screen.name === "words" && (
        <Words
          deck={screen.deck}
          stats={store.stats}
          onPractice={() => practice(screen.deck)}
          onHome={() => setScreen({ name: "home" })}
        />
      )}
    </div>
  )
}

