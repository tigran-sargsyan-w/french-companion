import { useQuery } from "@tanstack/react-query";
import { useContentVersion } from "@/data";

export const PERSONAL_TENSES = [
  { id: "present", label: "Présent", group: "indicatif" },
  { id: "passe_compose", label: "Passé composé", group: "indicatif" },
  { id: "imparfait", label: "Imparfait", group: "indicatif" },
  { id: "plus_que_parfait", label: "Plus-que-parfait", group: "indicatif" },
  { id: "passe_simple", label: "Passé simple", group: "indicatif" },
  { id: "passe_anterieur", label: "Passé antérieur", group: "indicatif" },
  { id: "futur_proche", label: "Futur proche", group: "indicatif" },
  { id: "futur_simple", label: "Futur simple", group: "indicatif" },
  { id: "futur_anterieur", label: "Futur antérieur", group: "indicatif" },
  { id: "subjonctif_present", label: "Subjonctif présent", group: "subjonctif" },
  { id: "subjonctif_passe", label: "Subjonctif passé", group: "subjonctif" },
  { id: "subjonctif_imparfait", label: "Subjonctif imparfait", group: "subjonctif" },
  { id: "subjonctif_plus_que_parfait", label: "Subjonctif plus-que-parfait", group: "subjonctif" },
  { id: "conditionnel_present", label: "Conditionnel présent", group: "conditionnel" },
  { id: "conditionnel_passe", label: "Conditionnel passé", group: "conditionnel" },
  { id: "imperatif_present", label: "Impératif présent", group: "imperatif" },
  { id: "imperatif_passe", label: "Impératif passé", group: "imperatif" },
] as const;

export const NON_FINITE_TENSES = [
  { id: "infinitif_present", label: "Infinitif présent", group: "non_finite" },
  { id: "infinitif_passe", label: "Infinitif passé", group: "non_finite" },
  { id: "participe_present", label: "Participe présent", group: "non_finite" },
  { id: "participe_passe", label: "Participe passé", group: "non_finite" },
  { id: "gerondif_present", label: "Gérondif présent", group: "non_finite" },
  { id: "gerondif_passe", label: "Gérondif passé", group: "non_finite" },
] as const;

export const TENSES = [...PERSONAL_TENSES, ...NON_FINITE_TENSES] as const;
export const TENSE_GROUPS = [
  { id: "indicatif", label: "Indicatif" },
  { id: "subjonctif", label: "Subjonctif" },
  { id: "conditionnel", label: "Conditionnel" },
  { id: "imperatif", label: "Impératif" },
  { id: "non_finite", label: "Formes non personnelles (sans pronom)" },
] as const;

export type PersonalTense = (typeof PERSONAL_TENSES)[number]["id"];
export type NonFiniteTense = (typeof NON_FINITE_TENSES)[number]["id"];
export type Tense = PersonalTense | NonFiniteTense;
export const PRONOUNS = ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"] as const;
export type Pronoun = (typeof PRONOUNS)[number];
export type VerbGroup = "regular" | "irregular";

export type ConjugationVerb = {
  infinitive: string;
  status: "learning" | "learned";
  group: VerbGroup;
  forms: Partial<Record<PersonalTense, Partial<Record<Pronoun, string>>>>;
  nonFinite: Partial<Record<NonFiniteTense, string>>;
};

export function isNonFinite(tense: Tense): tense is NonFiniteTense {
  return NON_FINITE_TENSES.some((item) => item.id === tense);
}

/**
 * The lesson bundle and conjugation bundle share the same version sentinel,
 * but this query runs only when the Conjugaison route is mounted.
 */
export function useConjugationVerbs() {
  const versionQuery = useContentVersion();
  const version = versionQuery.data?.version;
  return useQuery({
    queryKey: ["conjugaison-verbs", version ?? "version-unavailable"],
    queryFn: async (): Promise<ConjugationVerb[]> => {
      if (!version) throw versionQuery.error ?? new Error("Version du contenu indisponible.");
      const url = `${import.meta.env.BASE_URL}data/conjugaison/verbs-bundle.json?v=${encodeURIComponent(version)}`;
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`Impossible de charger les conjugaisons : ${response.status}`);
      const data: { verbs: ConjugationVerb[] } = await response.json();
      return data.verbs.filter((verb) => verb.status === "learning")
        .sort((a, b) => a.infinitive.localeCompare(b.infinitive, "fr"));
    },
    enabled: Boolean(version) || versionQuery.isError,
    staleTime: Infinity,
  });
}


export type Prompt = { verb: ConjugationVerb; tense: Tense; pronoun: Pronoun | null };
export type Question = Prompt & { choices: string[]; correctIndex: number; correct: string };

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function bareForm(form: string): string {
  return form.replace(/^(?:je |j'|tu |il |elle |on |nous |vous |ils |elles )/, "");
}

/** Each answer pool is rebuilt; distractors use other forms of the same verb. */
export function createQuestion(prompt: Prompt): Question | null {
  let correct: string | undefined;
  const pool = new Set<string>();
  if (isNonFinite(prompt.tense)) {
    correct = prompt.verb.nonFinite?.[prompt.tense];
    if (!correct) return null;
    for (const [tense, form] of Object.entries(prompt.verb.nonFinite ?? {})) {
      if (tense !== prompt.tense && form !== correct && form) pool.add(form);
    }
  } else {
    if (!prompt.pronoun) return null;
    correct = prompt.verb.forms[prompt.tense]?.[prompt.pronoun];
    if (!correct) return null;
    const imperative = prompt.tense === "imperatif_present" || prompt.tense === "imperatif_passe";
    for (const [tense, forms] of Object.entries(prompt.verb.forms)) {
      if (tense === prompt.tense || tense.startsWith("imperatif_")) continue;
      const value = forms?.[prompt.pronoun];
      if (value) {
        const option = imperative ? bareForm(value) : value;
        if (option !== correct) pool.add(option);
      }
    }
    // For imperative questions, the *other* imperative form is also a useful
    // distractor, since both are written without a subject.
    if (imperative) {
      const other = prompt.tense === "imperatif_present" ? "imperatif_passe" : "imperatif_present";
      const value = prompt.verb.forms[other]?.[prompt.pronoun];
      if (value && value !== correct) pool.add(value);
    }
  }
  if (pool.size < 3) return null;
  const choices = shuffle([correct, ...shuffle([...pool]).slice(0, 3)]);
  return { ...prompt, choices, correctIndex: choices.indexOf(correct), correct };
}

/**
 * Labels every tense that matches a displayed option.
 * Some verb forms are homographs across tenses, so return all matches rather
 * than claiming that one written answer always identifies a unique tense.
 */
export function getChoiceTenseLabels(prompt: Prompt, choice: string): string[] {
  if (isNonFinite(prompt.tense)) {
    return NON_FINITE_TENSES
      .filter((tense) => prompt.verb.nonFinite?.[tense.id] === choice)
      .map((tense) => tense.label);
  }
  if (!prompt.pronoun) return [];
  const imperative = prompt.tense.startsWith("imperatif_");
  return PERSONAL_TENSES
    .filter((tense) => {
      const value = prompt.verb.forms[tense.id]?.[prompt.pronoun!];
      if (!value) return false;
      return (imperative && !tense.id.startsWith("imperatif_")
        ? bareForm(value)
        : value) === choice;
    })
    .map((tense) => tense.label);
}

/** Personal forms respect chosen pronouns. Non-finite forms never require one. */
export function createDeck(
  available: readonly ConjugationVerb[],
  tenses: readonly Tense[],
  pronouns: readonly Pronoun[],
  limit: number,
): Question[] {
  const prompts: Prompt[] = shuffle(available.flatMap((verb) =>
    tenses.flatMap((tense): Prompt[] => {
      if (isNonFinite(tense)) {
        return verb.nonFinite?.[tense] ? [{ verb, tense, pronoun: null }] : [];
      }
      return pronouns.filter((pronoun) => Boolean(verb.forms[tense]?.[pronoun]))
        .map((pronoun) => ({ verb, tense, pronoun }));
    }),
  ));

  // Avoid the same verb in successive questions whenever another one exists.
  for (let i = 1; i < prompts.length; i++) {
    if (prompts[i].verb.infinitive !== prompts[i - 1].verb.infinitive) continue;
    const replacement = prompts.findIndex((candidate, j) =>
      j > i && candidate.verb.infinitive !== prompts[i - 1].verb.infinitive &&
      (j + 1 === prompts.length || prompts[j + 1].verb.infinitive !== prompts[i].verb.infinitive),
    );
    if (replacement >= 0) [prompts[i], prompts[replacement]] = [prompts[replacement], prompts[i]];
  }

  const deck: Question[] = [];
  for (const prompt of prompts) {
    const question = createQuestion(prompt);
    if (question) deck.push(question);
    if (deck.length >= limit) break;
  }
  return deck;
}
