import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useLearningData } from "@/data";

export const Route = createFileRoute("/vocabulary_/unlearned")({
  component: UnlearnedVocabularyPage,
  head: () => ({
    meta: [
      { title: "Mots non appris — Salut" },
      {
        name: "description",
        content: "Liste imprimable des mots de vocabulaire qui ne sont pas encore appris.",
      },
    ],
  }),
});

function UnlearnedVocabularyPage() {
  const learningDataQuery = useLearningData();

  const unlearnedWords = learningDataQuery.data
    ? learningDataQuery.data.vocabulary
        .filter((word) => word.status !== "learned")
        .sort((a, b) => a.french.localeCompare(b.french, "fr", { sensitivity: "base" }))
    : [];

  return (
    <main className="unlearned-vocabulary-page">
      <style>{`
        .unlearned-vocabulary-page {
          width: min(100%, 210mm);
          min-height: 297mm;
          margin: 0 auto;
          padding: 12mm 14mm;
          background: #ffffff;
          color: #0f172a;
        }

        .unlearned-vocabulary-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 10mm;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1d4ed8;
          text-decoration: none;
        }

        .unlearned-vocabulary-back:hover {
          text-decoration: underline;
        }

        .unlearned-vocabulary-list {
          column-count: 2;
          column-gap: 12mm;
          font-size: 11pt;
          line-height: 1.45;
        }

        .unlearned-vocabulary-item {
          break-inside: avoid;
          margin-bottom: 2.5mm;
          overflow-wrap: anywhere;
        }

        .unlearned-vocabulary-word {
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .unlearned-vocabulary-page {
            min-height: 100vh;
            padding: 1.25rem;
          }

          .unlearned-vocabulary-list {
            column-count: 1;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html,
          body,
          #root {
            background: #ffffff !important;
          }

          body {
            margin: 0;
          }

          .unlearned-vocabulary-page {
            width: auto;
            min-height: 0;
            margin: 0;
            padding: 0;
          }

          .unlearned-vocabulary-back {
            display: none !important;
          }

          .unlearned-vocabulary-list {
            column-count: 2;
            column-gap: 10mm;
          }
        }
      `}</style>

      <Link to="/vocabulary" className="unlearned-vocabulary-back">
        <ArrowLeft className="h-4 w-4" />
        Retour au vocabulaire
      </Link>

      {learningDataQuery.isPending && <p>Chargement…</p>}

      {learningDataQuery.isError && (
        <p>Impossible de charger les mots de vocabulaire.</p>
      )}

      {learningDataQuery.isSuccess && unlearnedWords.length === 0 && (
        <p>Tous les mots sont appris.</p>
      )}

      {learningDataQuery.isSuccess && unlearnedWords.length > 0 && (
        <section className="unlearned-vocabulary-list" aria-label="Mots non appris">
          {unlearnedWords.map((word) => (
            <div key={word.id} className="unlearned-vocabulary-item">
              <span className="unlearned-vocabulary-word">{word.french}</span>
              <span> — {word.translation}</span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
