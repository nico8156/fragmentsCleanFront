import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";

export function ScanTicketSuccessContent({ onTickets, onPass }: { onTickets: () => void; onPass: () => void }) {
    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.message}>
                    <Text accessibilityRole="header" style={styles.title}>Ticket envoyé</Text>
                    <Text style={styles.subtitle}>Ton justificatif a bien été transmis. Il est maintenant en cours d’analyse.</Text>
                </View>
                <View style={styles.actions}>
                    <FragmentsButton label="Voir mes tickets" onPress={onTickets} />
                    <FragmentsButton label="Retour au Pass" variant="secondary" onPress={onPass} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    content: { flexGrow: 1, padding: spacing.section, gap: spacing.section },
    message: { flexGrow: 1, justifyContent: "center", gap: spacing.standard, paddingVertical: spacing.section },
    title: { ...typography.screen, color: palette.textPrimary },
    subtitle: { ...typography.body, color: palette.textSecondary },
    actions: { gap: spacing.compact },
});
