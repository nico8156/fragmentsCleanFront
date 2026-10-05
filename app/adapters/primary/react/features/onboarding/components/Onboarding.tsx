import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { typography } from "@/app/adapters/primary/react/css/designTokens";
import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.content}>
                <Image source={require("@/assets/images/icon.png")} style={styles.symbol}
                    resizeMode="contain" accessible={false} />
                <Text accessibilityRole="header" style={styles.title}>Fragments</Text>
                <Text style={styles.message}>Ton carnet de cafés.</Text>
                <View style={styles.action}>
                    <FragmentsButton label="Continuer" onPress={onFinish} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: palette.background },
    content: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
    symbol: { width: 112, height: 112 },
    title: { ...typography.screen, color: palette.textPrimary, textAlign: "center" },
    message: { ...typography.body, color: palette.textSecondary, textAlign: "center" },
    action: { width: "100%", maxWidth: 360, marginTop: 24 },
});
