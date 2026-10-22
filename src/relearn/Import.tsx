import { useRef, useState, type DragEvent, type FormEvent } from "react"
import { faced } from "./cards"
import { SheetGuide } from "./Guide"
import { languageById } from "./languages"
import { parseTable, rowsToCards } from "./parseSheet"
import { fetchSheetCsv, rowsFromFile } from "./spreadsheets"
import type { Card } from "./types"
import { Mark } from "./Mark"

type Preview = {
  cards: Card[]
  skipped: number
  title: string
}

type ImportProps = {
  learningLang: string
  replacing: boolean
  onCancel: () => void
  onStart: (cards: Card[], title: string) => void
}

export function ImportSheet({ learningLang, replacing, onCancel, onStart }: ImportProps) {
  const language = languageById(learningLang)
  const fileRef = useRef<HTMLInputElement>(null)
  const [link, setLink] = useState("")
  const [paste, setPaste] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hot, setHot] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)

function applyRows(rows: string[][], title: string) {
    const parsed = rowsToCards(rows, learningLang)
    if (parsed.cards.length === 0) {
      setPreview(null)
      setError(
        `No ${language?.name ?? "matching"} words were in that sheet. Export has four columns, and either side can be ${language?.name ?? "the language you're learning"}.`,
      )
      return
    }
    setError(null)
    setPreview({ cards: parsed.cards, skipped: parsed.skipped, title })
  }

  async function loadLink(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const text = await fetchSheetCsv(link)
      applyRows(parseTable(text), "Saved translations")
    } catch (caught) {
      setPreview(null)
      setError(caught instanceof Error ? caught.message : "I couldn't read that sheet.")
    } finally {
      setBusy(false)
    }
  }

  async function loadFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const rows = await rowsFromFile(file)
      const title = file.name.replace(/\.[^.]+$/, "") || "Saved translations"
      applyRows(rows, title)
    } catch (caught) {
      setPreview(null)
      setError(caught instanceof Error ? caught.message : "I couldn't read that file.")
    } finally {
      setBusy(false)
    }
  }

  function loadPaste(event: FormEvent) {
    event.preventDefault()
    applyRows(parseTable(paste), "Saved translations")
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setHot(false)
    const file = event.dataTransfer.files[0]
    if (file) void loadFile(file)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="brand-button" onClick={onCancel}>
          <Mark />
          <span>ReLearn</span>
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Back
        </button>
      </header>

      <SheetGuide />

      <section className={`loader ${hot ? "hot" : ""}`} onDragOver={(event) => { event.preventDefault(); setHot(true) }} onDragLeave={() => setHot(false)} onDrop={onDrop}>
        <h2>Load the sheet</h2>
        <p className="lede">
          You're learning {language?.name}. Your list stays in this browser.
        </p>

        <form onSubmit={loadLink} className="stack">
          <label>
            Google Sheets link
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              inputMode="url"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="primary" disabled={busy || !link.trim()}>
            {busy ? "Reading…" : "Load the link"}
          </button>
        </form>

        <p className="or">or</p>

        <input
          ref={fileRef}
          className="file"
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xlsm,text/csv,text/tab-separated-values"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void loadFile(file)
            event.target.value = ""
          }}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
          Upload CSV or Excel
        </button>
        <p className="fine">You can also drop the file here. In Sheets: File → Download → CSV or Excel.</p>

        <form onSubmit={loadPaste} className="stack paste">
          <label>
            Or paste the rows
            <textarea
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              rows={5}
              placeholder={"Hebrew\tEnglish\tגחליליות\tFireflies"}
            />
          </label>
          <button type="submit" disabled={!paste.trim() || busy}>
            Use these rows
          </button>
        </form>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        {preview && (
          <div className="preview">
            <h3>
              {preview.cards.length.toLocaleString("en-US")} {language?.name} {preview.cards.length === 1 ? "word" : "words"} ready
            </h3>
            {preview.skipped > 0 && (
              <p className="fine">
                {preview.skipped.toLocaleString("en-US")} {preview.skipped === 1 ? "row wasn't" : "rows weren't"}{" "}
                {language?.name}, so {preview.skipped === 1 ? "it was" : "they were"} left out.
              </p>
            )}
            {replacing && (
              <p className="fine">
                This replaces the {language?.name} list you already saved. Scores for words that are still in the list
                stay.
              </p>
            )}
            <ul className="review">
              {preview.cards.slice(0, 6).map((card) => {
                const face = faced(card, "recall")
                return (
                  <li key={card.id}>
                    <span dir={languageById(face.promptLang)?.dir} lang={languageById(face.promptLang)?.speech}>
                      {face.prompt}
                    </span>
                    <span className="word" dir={languageById(card.learningLang)?.dir} lang={languageById(card.learningLang)?.speech}>
                      {card.learning}
                    </span>
                  </li>
                )
              })}
            </ul>
            <button type="button" className="primary" onClick={() => onStart(preview.cards, preview.title)}>
              Start a round
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
