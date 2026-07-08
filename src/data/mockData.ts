export type VocabStatus = "new" | "learning" | "learned";

export interface VocabWord {
  id: string;
  french: string;
  translation: string;
  example: string;
  status: VocabStatus;
  firstSeenLessonId: string;
  appearances: number;
}

export interface GrammarTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  examples: string[];
}

export interface Mistake {
  id: string;
  category: "Grammar" | "Vocabulary" | "Pronunciation" | "Spelling";
  wrong: string;
  correct: string;
  note: string;
  lessonId: string;
}

export interface HomeworkItem {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  dueDate: string;
  done: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  date: string; // ISO
  summary: string;
  grammarTopicIds: string[];
  vocabIds: string[];
  homeworkIds: string[];
  notes: string;
  photos: string[];
}

export const vocabulary: VocabWord[] = [
  { id: "v1", french: "bonjour", translation: "hello", example: "Bonjour, comment ça va ?", status: "learned", firstSeenLessonId: "l1", appearances: 12 },
  { id: "v2", french: "merci", translation: "thank you", example: "Merci beaucoup !", status: "learned", firstSeenLessonId: "l1", appearances: 9 },
  { id: "v3", french: "la boulangerie", translation: "bakery", example: "Je vais à la boulangerie.", status: "learning", firstSeenLessonId: "l2", appearances: 4 },
  { id: "v4", french: "flâner", translation: "to stroll", example: "J'aime flâner dans Paris.", status: "learning", firstSeenLessonId: "l3", appearances: 2 },
  { id: "v5", french: "dépaysement", translation: "change of scenery", example: "Ce voyage était un vrai dépaysement.", status: "new", firstSeenLessonId: "l4", appearances: 1 },
  { id: "v6", french: "chuchoter", translation: "to whisper", example: "Elle chuchote un secret.", status: "new", firstSeenLessonId: "l4", appearances: 1 },
  { id: "v7", french: "le quotidien", translation: "everyday life", example: "Le quotidien peut être poétique.", status: "learning", firstSeenLessonId: "l3", appearances: 3 },
  { id: "v8", french: "épanoui", translation: "fulfilled", example: "Il se sent épanoui dans son travail.", status: "new", firstSeenLessonId: "l5", appearances: 1 },
  { id: "v9", french: "râler", translation: "to grumble", example: "Les Français adorent râler.", status: "learning", firstSeenLessonId: "l2", appearances: 3 },
  { id: "v10", french: "la rentrée", translation: "back-to-school season", example: "La rentrée commence en septembre.", status: "learned", firstSeenLessonId: "l1", appearances: 5 },
];

export const grammar: GrammarTopic[] = [
  { id: "g1", title: "Présent des verbes en -er", category: "Verbs", summary: "Regular conjugation of -er verbs in the present tense.", examples: ["je parle", "tu parles", "nous parlons"] },
  { id: "g2", title: "Passé composé avec avoir", category: "Tenses", summary: "Compound past using 'avoir' + past participle.", examples: ["J'ai mangé", "Nous avons vu"] },
  { id: "g3", title: "Articles définis et indéfinis", category: "Articles", summary: "Difference between le/la/les and un/une/des.", examples: ["le livre", "une pomme", "des amis"] },
  { id: "g4", title: "Adjectifs — accord", category: "Adjectives", summary: "Adjective agreement in gender and number.", examples: ["un petit chat", "une petite maison"] },
  { id: "g5", title: "Subjonctif présent", category: "Moods", summary: "Present subjunctive after expressions of doubt, wish, emotion.", examples: ["Il faut que tu viennes", "Je veux qu'il parte"] },
  { id: "g6", title: "Pronoms COD / COI", category: "Pronouns", summary: "Direct and indirect object pronouns.", examples: ["Je le vois", "Je lui parle"] },
];

export const mistakes: Mistake[] = [
  { id: "m1", category: "Grammar", wrong: "Je suis allé au maison", correct: "Je suis allé à la maison", note: "à + la, not au (au = à + le).", lessonId: "l2" },
  { id: "m2", category: "Grammar", wrong: "Il faut que tu viens", correct: "Il faut que tu viennes", note: "Il faut que + subjunctive.", lessonId: "l5" },
  { id: "m3", category: "Vocabulary", wrong: "Je suis chaud", correct: "J'ai chaud", note: "Use 'avoir' for physical states.", lessonId: "l1" },
  { id: "m4", category: "Pronunciation", wrong: "plu-s (silent s dropped)", correct: "plus [plys] vs [ply]", note: "Pronounce 's' in 'plus' when it means 'more'.", lessonId: "l3" },
  { id: "m5", category: "Spelling", wrong: "developement", correct: "développement", note: "Two 'p', accent aigu on the first 'e'.", lessonId: "l4" },
  { id: "m6", category: "Grammar", wrong: "Je l'ai donné à il", correct: "Je le lui ai donné", note: "Use pronoun 'lui' after another pronoun.", lessonId: "l4" },
];

export const homework: HomeworkItem[] = [
  { id: "h1", lessonId: "l1", title: "Write 5 sentences", description: "Introduce yourself using être and avoir.", dueDate: "2026-07-10", done: true },
  { id: "h2", lessonId: "l2", title: "Conjugation drill", description: "Conjugate 10 -er verbs in present tense.", dueDate: "2026-07-12", done: true },
  { id: "h3", lessonId: "l3", title: "Read short story", description: "Read 'Le Petit Prince' chapter 1 and note new words.", dueDate: "2026-07-14", done: false },
  { id: "h4", lessonId: "l4", title: "Grammar exercise", description: "Complete subjunctive worksheet pages 12–13.", dueDate: "2026-07-16", done: false },
  { id: "h5", lessonId: "l5", title: "Listening", description: "Watch 20-min French podcast and summarize.", dueDate: "2026-07-18", done: false },
];

export const lessons: Lesson[] = [
  {
    id: "l1",
    title: "Se présenter",
    date: "2026-06-15",
    summary: "Basics of introducing yourself: name, age, nationality, hobbies.",
    grammarTopicIds: ["g1", "g3"],
    vocabIds: ["v1", "v2", "v10"],
    homeworkIds: ["h1"],
    notes: "Focused on être and avoir. Practiced dialogues in pairs.",
    photos: [],
  },
  {
    id: "l2",
    title: "En ville",
    date: "2026-06-22",
    summary: "Vocabulary for city life: shops, directions, transport.",
    grammarTopicIds: ["g3", "g1"],
    vocabIds: ["v3", "v9"],
    homeworkIds: ["h2"],
    notes: "Roleplay: asking for directions to la boulangerie.",
    photos: [],
  },
  {
    id: "l3",
    title: "La vie quotidienne",
    date: "2026-06-29",
    summary: "Talking about everyday life and routines.",
    grammarTopicIds: ["g2", "g4"],
    vocabIds: ["v4", "v7"],
    homeworkIds: ["h3"],
    notes: "Passé composé introduced. Common time expressions.",
    photos: [],
  },
  {
    id: "l4",
    title: "Voyager en France",
    date: "2026-07-01",
    summary: "Travel vocabulary and past tense storytelling.",
    grammarTopicIds: ["g2", "g6"],
    vocabIds: ["v5", "v6"],
    homeworkIds: ["h4"],
    notes: "Told stories about last summer. New idioms about voyage.",
    photos: [],
  },
  {
    id: "l5",
    title: "Exprimer ses émotions",
    date: "2026-07-06",
    summary: "Talking about feelings, wishes and doubts.",
    grammarTopicIds: ["g5", "g6"],
    vocabIds: ["v8"],
    homeworkIds: ["h5"],
    notes: "Subjonctif introduced. Practiced 'il faut que', 'je veux que'.",
    photos: [],
  },
];

export function getLesson(id: string) {
  return lessons.find((l) => l.id === id);
}
export function getVocab(ids: string[]) {
  return vocabulary.filter((v) => ids.includes(v.id));
}
export function getGrammar(ids: string[]) {
  return grammar.filter((g) => ids.includes(g.id));
}
export function getHomework(ids: string[]) {
  return homework.filter((h) => ids.includes(h.id));
}
