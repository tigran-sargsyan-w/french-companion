import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/data/conjugaison/verbs");
const tenses = [
  "present", "imparfait", "passe_compose", "plus_que_parfait", "futur_proche",
  "futur_simple", "futur_anterieur", "conditionnel_present", "conditionnel_passe",
  "subjonctif_present", "subjonctif_passe", "passe_simple", "imperatif_present",
];
const pronouns = ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"];
const errors = [], seen = new Set();
const files = fs.readdirSync(root).filter((file) => file.endsWith(".json")).sort();
if (!files.length) errors.push("No conjugation JSON files found");

for (const file of files) {
  let verb;
  try { verb = JSON.parse(fs.readFileSync(path.join(root, file), "utf8")); }
  catch (error) { errors.push(`${file}: invalid JSON (${error.message})`); continue; }
  const prefix = `${file}: `;
  if (typeof verb.infinitive !== "string" || !verb.infinitive.trim()) {
    errors.push(prefix + "missing infinitive");
  } else if (seen.has(verb.infinitive)) {
    errors.push(prefix + "duplicate infinitive " + verb.infinitive);
  }
  seen.add(verb.infinitive);
  if (!["learning", "learned"].includes(verb.status)) errors.push(prefix + "invalid status");
  if (!["regular", "irregular"].includes(verb.group)) errors.push(prefix + "invalid group");
  if (!verb.forms || typeof verb.forms !== "object") { errors.push(prefix + "missing forms"); continue; }
  for (const key of Object.keys(verb.forms)) {
    if (!tenses.includes(key)) errors.push(prefix + "unknown tense " + key);
  }
  for (const tense of tenses) {
    const forms = verb.forms[tense];
    if (tense === "imperatif_present" && !forms) continue; // e.g. pouvoir
    if (!forms || typeof forms !== "object") { errors.push(prefix + "missing " + tense); continue; }
    const permitted = tense === "imperatif_present" ? ["tu", "nous", "vous"] : pronouns;
    if (Object.keys(forms).length !== permitted.length) errors.push(prefix + tense + ": incomplete persons");
    for (const p of permitted) {
      if (typeof forms[p] !== "string" || !forms[p].trim()) errors.push(prefix + tense + " missing " + p);
    }
    for (const p of Object.keys(forms)) if (!permitted.includes(p)) errors.push(prefix + tense + " unexpected " + p);
  }

  // Four distinct choices must be possible from forms of the same verb,
  // keeping one correct answer and three distractors of other tenses.
  for (const tense of tenses) {
    if (!verb.forms[tense]) continue;
    for (const per of (tense === "imperatif_present" ? ["tu", "nous", "vous"] : pronouns)) {
      const answer = verb.forms[tense][per];
      const choices = new Set();
      for (const other of tenses) {
        if (other === tense || other === "imperatif_present") continue;
        let value = verb.forms[other]?.[per];
        if (typeof value !== "string") continue;
        if (tense === "imperatif_present") {
          value = value.replace(/^(?:je |j'|tu |il |elle |on |nous |vous |ils |elles )/, "");
        }
        if (value !== answer) choices.add(value);
      }
      if (choices.size < 3) errors.push(prefix + tense + "/" + per + ": fewer than 3 distinct distractors");
    }
  }
}

function sample(file, tense, person, expected) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    if (data.forms[tense]?.[person] !== expected) errors.push(`${file}: unexpected ${tense}/${person}`);
  } catch (e) { errors.push(`${file}: cannot check sample: ${e.message}`); }
}
sample("venir.json", "futur_simple", "nous", "nous viendrons");
sample("envoyer.json", "futur_anterieur", "vous", "vous aurez envoyé");
sample("manger.json", "passe_simple", "je", "je mangeai");
sample("aller.json", "passe_compose", "elles", "elles sont allées");
sample("se-souvenir.json", "passe_compose", "elle", "elle s'est souvenue");
sample("s-habiller.json", "futur_proche", "je", "je vais m'habiller");

if (errors.length) {
  for (const error of errors.slice(0, 70)) console.error("✗", error);
  if (errors.length > 70) console.error(`...and ${errors.length - 70} more`);
  process.exitCode = 1;
} else {
  console.log(`✓ Validated ${files.length} verb JSON files, 13 tenses, all available person forms, and four-choice availability`);
}
