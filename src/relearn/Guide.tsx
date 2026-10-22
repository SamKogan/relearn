export function SheetGuide() {
  return (
    <section className="guide">
      <h2>How to get your starred words</h2>
      <ol>
        <li>
          Sign in at{" "}
          <a href="https://translate.google.com" target="_blank" rel="noreferrer">
            translate.google.com
          </a>
          .
        </li>
        <li>Translate a word, then click the star on the translation so it saves.</li>
        <li>Under the boxes, open Saved. On a phone, the star writes to the same list.</li>
        <li>At the top of Saved, click Export to Google Sheets.</li>
        <li>
          Bring that sheet here. Paste the link after you set sharing to anyone with the link, or use File →
          Download and upload the CSV or Excel file.
        </li>
      </ol>
      <p>
        The sheet has four columns: the two languages, then the text and its translation. Rows can run in either
        direction. ReLearn keeps the side in the language you're learning.
      </p>
      <table className="sheet">
        <caption>A saved-translations sheet</caption>
        <tbody>
          <tr>
            <td>Hebrew</td>
            <td>English</td>
            <td dir="rtl" lang="he">
              גחליליות
            </td>
            <td>Fireflies</td>
          </tr>
          <tr>
            <td>English</td>
            <td>Hebrew</td>
            <td>to plant</td>
            <td dir="rtl" lang="he">
              לשתול
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
