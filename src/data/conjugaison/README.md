# Conjugaison data

Each file in `public/data/conjugaison/verbs/` represents one verb and contains **explicit, reviewed** forms (not rules generated at runtime). The build script scans the directory and generates a single, gitignored `public/data/conjugaison/verbs-bundle.json` at build time. No manually maintained index is needed. The frontend fetches that bundle only on the Conjugaison route, versioned by the existing `public/data/content-version.json`.

## File contract

```json
{
  "infinitive": "venir",
  "status": "learning",
  "group": "irregular",
  "forms": {
    "present": {
      "je": "je viens",
      "tu": "tu viens",
      "il": "il vient",
      "elle": "elle vient",
      "on": "on vient",
      "nous": "nous venons",
      "vous": "vous venez",
      "ils": "ils viennent",
      "elles": "elles viennent"
    }
  }
}
```

Each tense can be added to `forms` with the same nine pronouns. `imperatif_present` only permits `tu`, `nous`, `vous`; its values contain no subject (e.g. `viens`). The shipped files include thirteen supported tenses wherever applicable.

- `status: "learning"`: included in randomly generated questions.
- `status: "learned"`: excluded from questions.
- `group`: `regular` or `irregular` for the user-facing filter.
- For past participles with `être`, subject agreement is explicit: `elle est venue`, `elles sont venues`. The personal forms `je`, `tu`, `on` default to masculine singular; `nous` and `vous` default to masculine plural.
- A missing tense/person combination is skipped (e.g. there is no imperative for `pouvoir`).
- The vocabulary review is independent of these files. Changing a JSON status requires a Git commit and a new deployment. The static website intentionally does not modify repository files.
- Quiz scores exist in React state for the duration of the session only. There is **no localStorage**.

Run `node scripts/validate-conjugaison.mjs` after editing the verb files. Update `public/data/content-version.json` when modifying conjugation data. The PR build runs the validator too.

The Conjugaison route is separate from the vocabulary review route; the conjugation JSON bundle is downloaded only when visiting Conjugaison (no 100+ individual network requests).
