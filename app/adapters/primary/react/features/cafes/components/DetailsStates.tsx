import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { ScreenHeader } from "@/app/adapters/primary/react/components/design/ScreenHeader";
import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { ContentState } from "@/app/adapters/primary/react/components/design/Primitives";

export function DetailsSkeleton({ onBack }: { onBack: () => void }) {
    return <DetailsState loading onBack={onBack} />;
}

export function DetailsError({ onBack }: { onBack: () => void }) {
    return <DetailsState loading={false} onBack={onBack} />;
}

function DetailsState({ loading, onBack }: { loading: boolean; onBack: () => void }) {
    return (
        <View style={s.safe}>
            <ScreenHeader title="Fiche café" onBack={onBack} />
            <ScrollClearance floatingTab={false}>
                <ScrollView contentContainerStyle={s.center}>
                    <ContentState kind={loading ? "loading" : "error"}
                        title={loading ? undefined : "Café introuvable"}
                        message={loading ? "Chargement…" : "Impossible de lire l’identifiant de ce café."} />
                </ScrollView>
            </ScrollClearance>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    center: { flexGrow: 1, justifyContent: "center", padding: 20 },
});
