import type { HomeworkItem } from "@/types";

export const homework: HomeworkItem[] = [
  {
    id: "h1",
    lessonId: "l1",
    title: "Write 5 sentences",
    description: "Introduce yourself using être and avoir.",
    dueDate: "2026-07-10",
    done: true,
  },
  {
    id: "h2",
    lessonId: "l2",
    title: "Conjugation drill",
    description: "Conjugate 10 -er verbs in present tense.",
    dueDate: "2026-07-12",
    done: true,
  },
  {
    id: "h3",
    lessonId: "l3",
    title: "Read short story",
    description: "Read 'Le Petit Prince' chapter 1 and note new words.",
    dueDate: "2026-07-14",
    done: false,
  },
  {
    id: "h4",
    lessonId: "l4",
    title: "Grammar exercise",
    description: "Complete subjunctive worksheet pages 12–13.",
    dueDate: "2026-07-16",
    done: false,
  },
  {
    id: "h5",
    lessonId: "l5",
    title: "Listening",
    description: "Watch 20-min French podcast and summarize.",
    dueDate: "2026-07-18",
    done: false,
  },
];
