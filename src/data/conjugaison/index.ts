import { useQuery } from "@tanstack/react-query";
import { useContentVersion } from "@/data";

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
