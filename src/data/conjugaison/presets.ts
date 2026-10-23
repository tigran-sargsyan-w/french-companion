import { TENSES, type Tense } from "./index";

/** Named selections of tense/form IDs; all values are validated by TypeScript. */
export const TENSE_PRESETS = [
  {
    id: "all",
    label: "Tout — entraînement complet",
    description: "Tous les temps et toutes les formes disponibles.",
    tenses: TENSES.map((tense) => tense.id),
  },
  {
    id: "daily",
    label: "Vie quotidienne",
    description: "Les temps les plus utiles pour parler, raconter et demander.",
    tenses: [
      "present", "passe_compose", "imparfait", "futur_proche",
      "futur_simple", "conditionnel_present", "subjonctif_present",
      "imperatif_present",
    ],
  },
  {
    id: "b1",
    label: "Révision B1",
    description: "Récits, passé et hypothèses, avec les temps courants du niveau B1.",
    tenses: [
      "present", "passe_compose", "imparfait", "plus_que_parfait",
      "futur_proche", "futur_simple", "conditionnel_present",
      "conditionnel_passe", "subjonctif_present", "imperatif_present",
    ],
  },
  {
    id: "b2",
    label: "Entraînement B2",
    description: "Temps et formes utiles au B2, sans les formes littéraires les plus rares.",
    tenses: [
      "present", "passe_compose", "imparfait", "plus_que_parfait",
      "futur_proche", "futur_simple", "futur_anterieur",
      "conditionnel_present", "conditionnel_passe",
      "subjonctif_present", "subjonctif_passe", "imperatif_present",
      "infinitif_passe", "participe_present", "participe_passe",
      "gerondif_present", "gerondif_passe",
    ],
  },
  {
    id: "subj_cond",
    label: "Subjonctif et conditionnel",
    description: "Tous les temps du subjonctif et du conditionnel, y compris littéraires.",
    tenses: [
      "subjonctif_present", "subjonctif_passe",
      "subjonctif_imparfait", "subjonctif_plus_que_parfait",
      "conditionnel_present", "conditionnel_passe",
    ],
  },
  {
    id: "literary",
    label: "Français littéraire",
    description: "Narration écrite et formes historiques ou soutenues.",
    tenses: [
      "present", "imparfait", "plus_que_parfait", "passe_simple",
      "passe_anterieur", "subjonctif_imparfait",
      "subjonctif_plus_que_parfait", "conditionnel_passe",
      "participe_present", "participe_passe", "gerondif_passe",
    ],
  },
  {
    id: "non_finite",
    label: "Formes non personnelles",
    description: "Infinitif, participe et gérondif, sans pronoms personnels.",
    tenses: [
      "infinitif_present", "infinitif_passe", "participe_present",
      "participe_passe", "gerondif_present", "gerondif_passe",
    ],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  description: string;
  tenses: readonly Tense[];
}[];

export type TensePresetId = (typeof TENSE_PRESETS)[number]["id"];
