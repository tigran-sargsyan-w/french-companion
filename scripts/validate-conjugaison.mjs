import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/data/conjugaison/verbs");
const finite = [
  "present", "passe_compose", "imparfait", "plus_que_parfait", "passe_simple",
  "passe_anterieur", "futur_proche", "futur_simple", "futur_anterieur",
  "subjonctif_present", "subjonctif_passe", "subjonctif_imparfait",
  "subjonctif_plus_que_parfait", "conditionnel_present", "conditionnel_passe",
  "imperatif_present", "imperatif_passe",
];
const nonFinite = [
  "infinitif_present", "infinitif_passe", "participe_present",
  "participe_passe", "gerondif_present", "gerondif_passe",
];
const persons = ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"];
const imperative = ["tu", "nous", "vous"];
const errors = [];
const seen = new Set();
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json")).sort();
const byFile = new Map();
if (!files.length) errors.push("Aucun fichier de conjugaison trouvé.");

const bare = (value) =>
  value.replace(/^(?:je |j'|tu |il |elle |on |nous |vous |ils |elles )/, "");

for (const filename of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(dir, filename), "utf8")); }
  catch (error) { errors.push(`${filename}: JSON invalide (${error.message})`); continue; }
  const report = (msg) => errors.push(`${filename}: ${msg}`);
  byFile.set(filename, data);

  if (!data.infinitive || typeof data.infinitive !== "string") report("infinitive absent");
  else if (seen.has(data.infinitive)) report("infinitive dupliqué : " + data.infinitive);
  seen.add(data.infinitive);
  if (!["learning", "learned"].includes(data.status)) report("status invalide");
  if (!["regular", "irregular"].includes(data.group)) report("group invalide");
  if (!data.forms || typeof data.forms !== "object") { report("forms absent"); continue; }
  if (!data.nonFinite || typeof data.nonFinite !== "object") { report("nonFinite absent"); continue; }
  for (const key of Object.keys(data.forms))
    if (!finite.includes(key)) report("temps inconnu : " + key);
  for (const key of Object.keys(data.nonFinite))
    if (!nonFinite.includes(key)) report("forme non personnelle inconnue : " + key);

  for (const tense of finite) {
    const forms = data.forms[tense];
    if (tense.startsWith("imperatif_") && !forms) continue;
    if (!forms || typeof forms !== "object") { report("temps manquant : " + tense); continue; }
    const allowed = tense.startsWith("imperatif_") ? imperative : persons;
    if (Object.keys(forms).length !== allowed.length) report(tense + ": nombre de personnes incorrect");
    for (const per of allowed) {
      if (typeof forms[per] !== "string" || !forms[per].trim())
        report(tense + "/" + per + ": forme manquante");
    }

    // Exactly one correct option and 3 *distinct* alternatives must be possible.
    for (const per of allowed) {
      const answer = forms[per];
      if (!answer) continue;
      const distractors = new Set();
      const isImperative = tense.startsWith("imperatif_");
      for (const [other, otherForms] of Object.entries(data.forms)) {
        if (tense === other || other.startsWith("imperatif_")) continue;
        const source = otherForms?.[per];
        if (!source) continue;
        const option = isImperative ? bare(source) : source;
        if (option !== answer) distractors.add(option);
      }
      if (isImperative) {
        const other = tense === "imperatif_present" ? "imperatif_passe" : "imperatif_present";
        const option = data.forms[other]?.[per];
        if (option && option !== answer) distractors.add(option);
      }
      if (distractors.size < 3) report(tense + "/" + per + ": moins de 3 distracteurs distincts");
    }
  }

  for (const type of nonFinite) {
    const answer = data.nonFinite[type];
    if (typeof answer !== "string" || !answer.trim()) {
      report("forme non personnelle manquante : " + type);
      continue;
    }
    const distractors = new Set(Object.entries(data.nonFinite)
      .filter(([key, value]) => key !== type && value && value !== answer)
      .map(([, value]) => value));
    if (distractors.size < 3) report(type + ": moins de 3 distracteurs distincts");
  }
}

function expect(filename, section, tense, person, expected) {
  const obj = byFile.get(filename);
  const actual = section === "nonFinite" ? obj?.nonFinite?.[tense] : obj?.forms?.[tense]?.[person];
  if (actual !== expected) errors.push(`${filename}: ${section}.${tense}/${person ?? "—"} : attendu « ${expected} », obtenu « ${actual} »`);
}
expect("venir.json", "forms", "futur_simple", "nous", "nous viendrons");
expect("envoyer.json", "forms", "futur_anterieur", "vous", "vous aurez envoyé");
expect("manger.json", "forms", "passe_simple", "je", "je mangeai");
expect("aller.json", "forms", "passe_compose", "elles", "elles sont allées");
expect("venir.json", "forms", "subjonctif_imparfait", "il", "il vînt");
expect("venir.json", "forms", "passe_anterieur", "nous", "nous fûmes venus");
expect("se-souvenir.json", "forms", "subjonctif_imparfait", "il", "il se souvînt");
expect("s-habiller.json", "forms", "futur_proche", "je", "je vais m'habiller");
expect("finir.json", "forms", "imperatif_passe", "tu", "aie fini");
expect("etre.json", "nonFinite", "participe_present", null, "étant");
expect("venir.json", "nonFinite", "infinitif_passe", null, "être venu");
expect("finir.json", "nonFinite", "gerondif_passe", null, "en ayant fini");
expect("se-souvenir.json", "nonFinite", "gerondif_passe", null, "en s'étant souvenu");

if (errors.length) {
  for (const error of errors.slice(0, 100)) console.error("✗", error);
  if (errors.length > 100) console.error(`...et encore ${errors.length - 100} erreurs`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${files.length} verbes : ${finite.length} temps, ${nonFinite.length} formes non personnelles et distracteurs validés`);
}
