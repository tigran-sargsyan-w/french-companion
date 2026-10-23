export const TENSES = [
  { id: "present", label: "Présent" },
  { id: "imparfait", label: "Imparfait" },
  { id: "passe_compose", label: "Passé composé" },
  { id: "plus_que_parfait", label: "Plus-que-parfait" },
  { id: "futur_proche", label: "Futur proche" },
  { id: "futur_simple", label: "Futur simple" },
  { id: "futur_anterieur", label: "Futur antérieur" },
  { id: "conditionnel_present", label: "Conditionnel présent" },
  { id: "conditionnel_passe", label: "Conditionnel passé" },
  { id: "subjonctif_present", label: "Subjonctif présent" },
  { id: "subjonctif_passe", label: "Subjonctif passé" },
  { id: "passe_simple", label: "Passé simple" },
  { id: "imperatif_present", label: "Impératif présent" },
] as const;

export type Tense = (typeof TENSES)[number]["id"];
export const PRONOUNS = ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"] as const;
export type Pronoun = (typeof PRONOUNS)[number];
export type VerbGroup = "regular" | "irregular";

export type ConjugationVerb = {
  infinitive: string;
  status: "learning" | "learned";
  group: VerbGroup;
  forms: Partial<Record<Tense, Partial<Record<Pronoun, string>>>>;
};

const importedVerbs = import.meta.glob("./verbs/*.json", { eager: true, import: "default" }) as Record<string, ConjugationVerb>;

/** Only imported by the Conjugaison route: never loads with vocabulary review. */
export const verbs: ConjugationVerb[] = Object.values(importedVerbs)
  .filter((verb) => verb.status === "learning")
  .sort((a, b) => a.infinitive.localeCompare(b.infinitive, "fr"));

export type Prompt = { verb: ConjugationVerb; tense: Tense; pronoun: Pronoun };
export type Question = Prompt & { choices: string[]; correctIndex: number; correct: string };

function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function bareForm(form: string): string {
  return form.replace(/^(?:je |j'|tu |il |elle |on |nous |vous |ils |elles )/, "");
}

export function createQuestion(prompt: Prompt): Question | null {
  const correct = prompt.verb.forms[prompt.tense]?.[prompt.pronoun];
  if (!correct) return null;

  // Impératif has no subject in the written form. Remove subjects from
  // distractors too, otherwise the correct answer would be too obvious.
  const imperative = prompt.tense === "imperatif_present";
  const pool = new Set<string>();
  for (const [tense, forms] of Object.entries(prompt.verb.forms)) {
    if (tense === prompt.tense || tense === "imperatif_present") continue;
    const value = forms?.[prompt.pronoun];
    if (value) {
      const option = imperative ? bareForm(value) : value;
      if (option !== correct) pool.add(option);
    }
  }
  if (pool.size < 3) return null;
  const choices = shuffle([correct, ...shuffle([...pool]).slice(0, 3)]);
  return { ...prompt, choices, correctIndex: choices.indexOf(correct), correct };
}

/** Randomizes all verb/person/tense combinations without repetition in a session. */
export function createDeck(
  available: readonly ConjugationVerb[],
  tenses: readonly Tense[],
  pronouns: readonly Pronoun[],
  limit: number,
): Question[] {
  const prompts = shuffle(available.flatMap((verb) =>
    tenses.flatMap((tense) =>
      pronouns.filter((pronoun) => verb.forms[tense]?.[pronoun])
        .map((pronoun) => ({ verb, tense, pronoun })),
    ),
  ));

  // Avoid identical verbs back-to-back, including when the deck is large.
  for (let i = 1; i < prompts.length; i++) {
    if (prompts[i].verb.infinitive === prompts[i - 1].verb.infinitive) {
      const replacement = prompts.findIndex((candidate, j) =>
        j > i && candidate.verb.infinitive !== prompts[i - 1].verb.infinitive
        && (j + 1 === prompts.length || prompts[j + 1].verb.infinitive !== prompts[i].verb.infinitive),
      );
      if (replacement >= 0) [prompts[i], prompts[replacement]] = [prompts[replacement], prompts[i]];
    }
  }

  const result: Question[] = [];
  for (const prompt of prompts) {
    const question = createQuestion(prompt);
    if (question) result.push(question);
    if (result.length === limit) break;
  }
  return result;
}
