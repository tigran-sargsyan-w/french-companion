import type { GrammarTopic } from "@/types";

export const grammar: GrammarTopic[] = [
  {
    id: "g1",
    title: "Présent des verbes en -er",
    category: "Verbs",
    summary: "Regular conjugation of -er verbs in the present tense.",
    examples: ["je parle", "tu parles", "nous parlons"],
  },
  {
    id: "g2",
    title: "Passé composé avec avoir",
    category: "Tenses",
    summary: "Compound past using 'avoir' + past participle.",
    examples: ["J'ai mangé", "Nous avons vu"],
  },
  {
    id: "g3",
    title: "Articles définis et indéfinis",
    category: "Articles",
    summary: "Difference between le/la/les and un/une/des.",
    examples: ["le livre", "une pomme", "des amis"],
  },
  {
    id: "g4",
    title: "Adjectifs — accord",
    category: "Adjectives",
    summary: "Adjective agreement in gender and number.",
    examples: ["un petit chat", "une petite maison"],
  },
  {
    id: "g5",
    title: "Subjonctif présent",
    category: "Moods",
    summary: "Present subjunctive after expressions of doubt, wish, emotion.",
    examples: ["Il faut que tu viennes", "Je veux qu'il parte"],
  },
  {
    id: "g6",
    title: "Pronoms COD / COI",
    category: "Pronouns",
    summary: "Direct and indirect object pronouns.",
    examples: ["Je le vois", "Je lui parle"],
  },
];
