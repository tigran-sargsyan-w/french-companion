export function DataLoadingState() {
  return (
    <div className="card-soft p-8 text-center">
      <div className="font-display text-xl">Chargement des données…</div>
      <p className="mt-2 text-sm text-muted-foreground">
        Les leçons et le vocabulaire sont chargés depuis les fichiers JSON.
      </p>
    </div>
  );
}

export function DataErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Erreur inconnue";

  return (
    <div className="card-soft p-8 text-center">
      <div className="font-display text-xl">Impossible de charger les données</div>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
