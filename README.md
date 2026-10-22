# ReLearn

People learning a second language often meet a word they want to keep, star it in Google Translate, and then forget the list exists. ReLearn is for that list. Connect or upload your saved translations, and stubbornly relearn those words until you commit them to memory.

A familiar word is easy to nod at and still fail to produce. ReLearn keeps score per word and spends the next round on the ones that are new or still shaky. A word only counts as remembered when you get it with no hint and no choices removed. Help is allowed. It just doesn't let the word retire.

## A round

Each round is ten words. You see the word in the language you're learning and give the meaning. You can flip that and produce the word yourself.

Two ways to answer:

- **Type** the translation. If you're stuck, Hint gives the shape of the answer in three steps: how long it is, then a mask, then one letter still missing. The full answer stays hidden.
- **Choose** among four options drawn from your list. Drop two removes two wrong answers and leaves the right one in place. The marked choices stay on screen until you press Next.

A miss comes back a few cards later in the same round. Words you already know well show up only when nothing weaker is waiting.

## Where the words come from

Star a translation on [Google Translate](https://translate.google.com), open Saved, and export to Google Sheets. Bring that sheet here with a shared link, a CSV or Excel file, or by pasting the rows. Rows can run in either direction. ReLearn keeps the side in the language you're learning.

If you don't have a list yet, practice 1,000 common Hebrew words. For any other language, bring your own saved translations. A short sample of starred Hebrew words is included so you can try a round first.

## Scores

Every word keeps a percent of unaided correct answers. Shaky words are listed first. A word becomes solid after several clean successes. Scores stay in this browser.

## Run it

```bash
npm install
npm run dev
```

`npm test` covers grading, the sheet parser, and which words come up next.
