import { ScrollView, StyleSheet, Text, View, Image, Pressable, ActivityIndicator } from "react-native";

import { useScanTicketScreenVM } from "@/app/adapters/secondary/viewModel/useScanTicketScreenVM";
import {palette} from "@/app/adapters/primary/react/css/colors";

export function ScanTicketScreen() {
    const { imageUri, ocrText, isProcessing, error, canSubmit, onPickImage, onSubmit } = useScanTicketScreenVM();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Scanner un ticket</Text>
            <Text style={styles.subtitle}>
                Capture ton ticket pour enregistrer ta visite et débloquer des récompenses.
            </Text>
            <Pressable
                style={({ pressed }) => [styles.captureButton, pressed && styles.captureButtonPressed]}
                onPress={onPickImage}
            >
                <Text style={styles.captureLabel}>{imageUri ? "Reprendre une photo" : "Prendre une photo"}</Text>
            </Pressable>
            {isProcessing ? (
                <View style={styles.processing}>
                    <ActivityIndicator size="small" color="#1C1C1E" />
                    <Text style={styles.processingText}>Analyse du ticket…</Text>
                </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}
            {ocrText ? (
                <View style={styles.ocrCard}>
                    <Text style={styles.ocrTitle}>Texte détecté</Text>
                    <Text style={styles.ocrContent}>{ocrText}</Text>
                </View>
            ) : null}
            <Pressable
                style={({ pressed }) => [
                    styles.submitButton,
                    canSubmit ? undefined : styles.submitButtonDisabled,
                    pressed && canSubmit ? styles.submitButtonPressed : undefined,
                ]}
                onPress={onSubmit}
                disabled={!canSubmit}
            >
                <Text style={styles.submitLabel}>Enregistrer le ticket</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#F5F5F5",
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    subtitle: {
        fontSize: 15,
        color: "#6E6E73",
        lineHeight: 22,
    },
    captureButton: {
        marginTop: 12,
        backgroundColor: palette.bg_light_90,
        paddingVertical: 14,
        borderRadius: 28,
        alignItems: "center",
    },
    captureButtonPressed: {
        opacity: 0.85,
    },
    captureLabel: {
        color: palette.accent_1,
        fontSize: 16,
        fontWeight: "600",

    },
    processing: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    processingText: {
        fontSize: 14,
        color: "#3A3A3C",
    },
    error: {
        color: "#B00020",
        fontSize: 14,
    },
    preview: {
        width: "100%",
        height: 240,
        borderRadius: 16,
    },
    ocrCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    ocrTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1C1C1E",
        marginBottom: 8,
    },
    ocrContent: {
        fontSize: 14,
        color: "#3A3A3C",
        lineHeight: 20,
    },
    submitButton: {
        marginTop: 16,
        backgroundColor: "#4F46E5",
        borderWidth:1,
        borderColor:palette.secondary_90,
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#D1D5DB",
    },
    submitButtonPressed: {
        opacity: 0.85,
    },
    submitLabel: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default ScanTicketScreen;
