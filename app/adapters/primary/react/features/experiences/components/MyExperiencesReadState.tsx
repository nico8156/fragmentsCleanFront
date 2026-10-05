import { ContentState } from "@/app/adapters/primary/react/components/design/Primitives";

export function MyExperiencesReadState({ loading, hasItems, error, onRetry }: {
    loading: boolean; hasItems: boolean; error?: string; onRetry: () => void;
}) {
    if (loading && !hasItems) {
        return <ContentState kind="loading" message="Chargement de tes expériences…" />;
    }
    if (error) {
        return <ContentState kind="error"
            message={hasItems ? "Données enregistrées affichées." : "Impossible de charger tes expériences."}
            action="Réessayer" onAction={onRetry} />;
    }
    if (!hasItems) {
        return <ContentState kind="empty" title="Aucune expérience pour le moment"
            message="Tu peux raconter une visite depuis la fiche d’un café, sans ticket." />;
    }
    return null;
}
