import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { answerForms, choiceOptions, faced, takeTwo } from "./cards"
import { isClose, isCorrect, senses } from "./grade"
import { hintFor } from "./hints"
import { languageById } from "./languages"
import { pickRound, whyThisCard } from "./schedule"
import { speak } from "./speak"
import type { Card, Deck, Direction, Mode, Outcome, WordStat } from "./types"
import { Mark } from "./Mark"

type Result = { card: Card; outcome: Outcome }

type PracticeProps = {
  deck: Deck
  stats: Record<string, WordStat>
  mode: Mode
  direction: Direction
  onMode: (mode: Mode) => void
  onDirection: (direction: Direction) => void
  onResult: (card: Card, outcome: Outcome) => void
  onHome: () => void
  onWords: () => void
}

export function Practice({
  deck,
  stats,
  mode,
  direction,
  onMode,
  onDirection,
  onResult,
  onHome,
  onWords,
}: PracticeProps) {
  const roundCount = Math.min(10, deck.cards.length)
  const [queue, setQueue] = useState(() => pickRound(deck.cards, stats, roundCount))
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [requeued, setRequeued] = useState<string[]>([])
  const [phase, setPhase] = useState<"ask" | "result" | "summary">("ask")
  const [typed, setTyped] = useState("")
  const [hint, setHint] = useState(0)
  const [hidden, setHidden] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | null>(null)
  const phaseRef = useRef<"ask" | "result" | "summary" | "moving">(phase)
  const indexRef = useRef(index)
  const queueRef = useRef(queue)
  const actions = useRef({
    advance: () => {},
    pick: (_slot: number) => {},
  })

  const card = queue[index]
  const face = card ? faced(card, direction) : null
  const expected = card ? (direction === "recall" ? card.learning : card.known) : ""
  const forms = card ? answerForms(card, direction) : { main: "", also: [] as string[] }
  const options = useMemo(
    () => (card && mode === "choice" ? choiceOptions(card, deck.cards, direction) : []),
    [card, deck.cards, direction, mode],
  )
  const visible = options
    .map((option, optionIndex) => ({ option, optionIndex }))
    .filter((item) => !hidden.includes(item.optionIndex))
  const learningName = languageById(deck.learningLang)?.name ?? "the word"
  const wrongLeft = visible.filter((item) => !isCorrect(expected, item.option)).length
  const streak = trailingClean(results)
  const close = outcome === "miss" && isClose(expected, typed)
  const verdict = outcome ? verdictCopy(outcome, close) : null

  function clearTimer() {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  function advance() {
    if (phaseRef.current !== "result") return
    clearTimer()
    phaseRef.current = "moving"
    const nextIndex = indexRef.current + 1
    if (nextIndex >= queueRef.current.length) {
      setPhase("summary")
      phaseRef.current = "summary"
      return
    }
    setIndex(nextIndex)
    indexRef.current = nextIndex
    setPhase("ask")
    phaseRef.current = "ask"
    setTyped("")
    setHint(0)
    setHidden([])
    setPicked(null)
    setOutcome(null)
  }

  function record(next: Outcome, attempt: string) {
    if (!card || phaseRef.current !== "ask") return
    phaseRef.current = "result"
    setPhase("result")
    setOutcome(next)
    setTyped(attempt)
    onResult(card, next)
    setResults((previous) => [...previous, { card, outcome: next }])
    if (next === "miss" && !requeued.includes(card.id)) {
      setRequeued((previous) => [...previous, card.id])
      setQueue((previous) => {
        const inserted = previous.slice()
        inserted.splice(Math.min(indexRef.current + 4, inserted.length), 0, card)
        queueRef.current = inserted
        return inserted
      })
    }
    if (next !== "miss" && mode !== "choice") {
      clearTimer()
      timer.current = window.setTimeout(() => advance(), next === "clean" ? 1600 : 2200)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!typed.trim()) return
    record(isCorrect(expected, typed) ? (hint > 0 ? "helped" : "clean") : "miss", typed)
  }

  function choose(optionIndex: number) {
    const option = options[optionIndex]
    if (!option) return
    setPicked(optionIndex)
    const correct = isCorrect(expected, option)
    record(correct ? (hidden.length > 0 ? "helped" : "clean") : "miss", option)
  }

  function nudge() {
    if (phase !== "ask" || hint >= 3) return
    setHint((level) => level + 1)
  }

  function dropTwo() {
    if (phase !== "ask" || wrongLeft < 3) return
    const pool = visible.filter((item) => !isCorrect(expected, item.option))
    const next = [...hidden]
    for (const removed of takeTwo(pool)) next.push(removed.optionIndex)
    setHidden(next)
  }

  function switchMode(next: Mode) {
    if (phase !== "ask") return
    onMode(next)
    setHidden([])
    setHint(0)
    setTyped("")
  }

  function switchDirection(next: Direction) {
    if (phase !== "ask") return
    onDirection(next)
    setHidden([])
    setHint(0)
    setTyped("")
  }

  function again() {
    clearTimer()
    const nextQueue = pickRound(deck.cards, stats, roundCount)
    queueRef.current = nextQueue
    indexRef.current = 0
    phaseRef.current = "ask"
    setQueue(nextQueue)
    setIndex(0)
    setResults([])
    setRequeued([])
    setPhase("ask")
    setTyped("")
    setHint(0)
    setHidden([])
    setPicked(null)
    setOutcome(null)
  }

  useEffect(() => {
    phaseRef.current = phase
    indexRef.current = index
    queueRef.current = queue
    actions.current.advance = advance
    actions.current.pick = (slot) => {
      const item = visible[slot]
      if (item) choose(item.optionIndex)
    }
  })

  useEffect(() => () => clearTimer(), [])

  useEffect(() => {
    if (phase === "ask" && mode === "type") inputRef.current?.focus()
  }, [index, mode, phase])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === "Enter" && phaseRef.current === "result") {
        event.preventDefault()
        actions.current.advance()
        return
      }
      if (phaseRef.current !== "ask" || mode !== "choice") return
      const slot = Number(event.key)
      if (slot >= 1 && slot <= 4) {
        event.preventDefault()
        actions.current.pick(slot - 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode])

  if (deck.cards.length === 0 || !card || !face) {
    return (
      <div className="shell">
        <Top onHome={onHome} onWords={onWords} meta={deck.title} />
        <p className="empty">This list doesn't have any words yet.</p>
      </div>
    )
  }

  if (phase === "summary") {
    return (
      <Summary
        deck={deck}
        results={results}
        onAgain={again}
        onHome={onHome}
        onWords={onWords}
      />
    )
  }

  const hintAnswer = senses(face.answer)[0] ?? face.answer
  const promptAttrs = textAttrs(face.promptLang)
  const answerAttrs = textAttrs(face.answerLang)

  return (
    <div className="shell practice">
      <Top
        onHome={onHome}
        onWords={onWords}
        meta={`${Math.min(index + 1, queue.length)} of ${queue.length}`}
        streak={phase === "ask" && streak >= 2 ? streak : 0}
      />
      <div className="dots" aria-hidden="true">
        {queue.map((item, dotIndex) => {
          const result = results[dotIndex]
          const name = result ? result.outcome : dotIndex === index ? "now" : "wait"
          return <i key={`${item.id}-${dotIndex}`} className={name} />
        })}
      </div>

      <div className="switches">
        <div className="segments" role="group" aria-label="How to answer">
          <button type="button" aria-pressed={mode === "type"} disabled={phase !== "ask"} onClick={() => switchMode("type")}>
            Type
          </button>
          <button type="button" aria-pressed={mode === "choice"} disabled={phase !== "ask"} onClick={() => switchMode("choice")}>
            Choose
          </button>
        </div>
        <div className="segments" role="group" aria-label="Which way to practice">
          <button type="button" aria-pressed={direction === "recall"} disabled={phase !== "ask"} onClick={() => switchDirection("recall")}>
            Write {learningName}
          </button>
          <button type="button" aria-pressed={direction === "recognize"} disabled={phase !== "ask"} onClick={() => switchDirection("recognize")}>
            Write the meaning
          </button>
        </div>
      </div>

      {phase === "ask" && <p className="why">{whyThisCard(stats[card.id])}</p>}

      <section className={`stage-card ${phase === "result" && outcome ? outcome : ""} ${outcome === "miss" && phase === "result" ? "shake" : ""}`}>
        <button
          type="button"
          className="hear"
          onClick={() =>
            speak(
              phase === "result" ? (direction === "recall" ? forms.main : face.prompt) : face.prompt,
              phase === "result" && direction === "recall" ? face.answerLang : face.promptLang,
            )
          }
        >
          Hear it
        </button>
        <p className={Array.from(face.prompt).length > 24 ? "prompt long" : "prompt"} {...promptAttrs}>
          {face.prompt}
        </p>

        {/* choice answers stay until Next */}
        {phase === "result" && mode === "type" && verdict ? (
          <div className="result" role="status">
            <p className="verdict">{verdict.title}</p>
            <p className="word answer" {...answerAttrs}>
              {forms.main}
            </p>
            {forms.also.length > 0 && <p className="also">Also accepted: {forms.also.join(", ")}</p>}
            <p className="note">{verdict.note}</p>
            <button type="button" className="primary" onClick={advance}>
              {index + 1 >= queue.length ? "See the round" : "Next"}
            </button>
          </div>
        ) : mode === "type" ? (
          <form onSubmit={submit}>
            <label className="entry">
              <span>{direction === "recall" ? learningName : "Meaning"}</span>
              <input
                ref={inputRef}
                className="answer-input"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                {...answerAttrs}
              />
            </label>
            {hint > 0 && <p className="hint">{hintFor(hintAnswer, hint as 1 | 2 | 3)}</p>}
            <div className="help-row">
              <button type="submit" className="primary" disabled={!typed.trim()}>
                Check
              </button>
              <button type="button" onClick={nudge} disabled={hint >= 3}>
                {hint === 0 ? "Hint" : hint < 3 ? "Another hint" : "Last hint"}
              </button>
              <button type="button" className="texty" onClick={() => record("miss", typed)}>
                I don't know
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="choices" role="group" aria-label="Choices">
              {visible.map((item, shown) => {
                const correct = isCorrect(expected, item.option)
                const chosen = picked === item.optionIndex
                const revealed = phase === "result"
                const className = revealed
                  ? correct
                    ? "option right"
                    : chosen
                      ? "option wrong"
                      : "option"
                  : "option"
                return (
                  <button
                    key={`${item.option}-${item.optionIndex}`}
                    type="button"
                    className={className}
                    onClick={() => choose(item.optionIndex)}
                    disabled={phase === "result"}
                    {...answerAttrs}
                  >
                    <span className="num">{shown + 1}</span>
                    <span className="word">{item.option}</span>
                  </button>
                )
              })}
            </div>
            {phase === "result" && verdict ? (
              <div className="result">
                <p className="verdict">{verdict.title}</p>
                <p className="note">{verdict.note}</p>
                <button type="button" className="primary" onClick={advance}>
                  {index + 1 >= queue.length ? "See the round" : "Next"}
                </button>
              </div>
            ) : (
              <>
                <div className="help-row">
                  <button type="button" onClick={dropTwo} disabled={wrongLeft < 3}>
                    Drop two
                  </button>
                  <button type="button" className="texty" onClick={() => record("miss", "")}>
                    I don't know
                  </button>
                </div>
                <p className="keys">
                  {visible.length > 1 ? `Keys 1–${visible.length} pick an answer.` : "Press 1 to answer."}
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function Top({
  onHome,
  onWords,
  meta,
  streak = 0,
}: {
  onHome: () => void
  onWords: () => void
  meta: string
  streak?: number
}) {
  return (
    <header className="topbar">
      <button type="button" className="brand-button" onClick={onHome}>
        <Mark />
        <span>ReLearn</span>
      </button>
      <p className="round-meta">
        <span>{meta}</span>
        {streak >= 2 && <span className="streak">{streak} in a row</span>}
      </p>
      <button type="button" className="ghost" onClick={onWords}>
        Scores
      </button>
    </header>
  )
}

function Summary({
  deck,
  results,
  onAgain,
  onHome,
  onWords,
}: {
  deck: Deck
  results: Result[]
  onAgain: () => void
  onHome: () => void
  onWords: () => void
}) {
  const clean = results.filter((result) => result.outcome === "clean").length
  const helped = results.filter((result) => result.outcome === "helped").length
  const misses = results.filter((result) => result.outcome === "miss").length
  const last = new Map<string, Result>()
  for (const result of results) last.set(result.card.id, result)
  const review = [...last.values()].filter((result) => result.outcome !== "clean")

  return (
    <div className="shell">
      <Top onHome={onHome} onWords={onWords} meta={deck.title} />
      <section className="summary">
        <h2>Round done</h2>
        <ul className="tally">
          <li>
            <strong>{clean}</strong>
            <span>remembered</span>
          </li>
          <li>
            <strong>{helped}</strong>
            <span>with help</span>
          </li>
          <li>
            <strong>{misses}</strong>
            <span>missed</span>
          </li>
        </ul>
        {review.length === 0 ? (
          <p className="note">Every word in this round ended remembered.</p>
        ) : (
          <>
            <h3>Worth another look</h3>
            <ul className="review">
              {review.map((result) => {
                const face = faced(result.card, "recall")
                return (
                  <li key={result.card.id}>
                    <span {...textAttrs(face.promptLang)}>{face.prompt}</span>
                    <span className="word" {...textAttrs(face.answerLang)}>
                      {result.card.learning}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <div className="help-row">
          <button type="button" className="primary" onClick={onAgain}>
            Another round
          </button>
          <button type="button" className="ghost" onClick={onWords}>
            Scores
          </button>
        </div>
      </section>
    </div>
  )
}

function trailingClean(results: Result[]): number {
  let count = 0
  for (let index = results.length - 1; index >= 0; index--) {
    if (results[index]?.outcome !== "clean") break
    count += 1
  }
  return count
}

function verdictCopy(outcome: Outcome, close: boolean): { title: string; note: string } {
  if (outcome === "clean") return { title: "Remembered", note: "That one counts." }
  if (outcome === "helped") {
    return { title: "With help", note: "Help doesn't count as remembered. It'll come back." }
  }
  if (close) return { title: "So close", note: "It'll come back soon." }
  return { title: "Not yet", note: "It'll come back soon." }
}

function textAttrs(langId: string): { dir: "rtl" | "ltr"; lang: string } {
  const language = languageById(langId)
  return { dir: language?.dir ?? "ltr", lang: language?.speech ?? langId }
}
