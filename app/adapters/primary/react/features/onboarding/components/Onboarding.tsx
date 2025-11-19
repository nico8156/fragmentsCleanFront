import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const slides = [
    {
        key: "1",
        title: "Découvrez les cafés de spécialité à Rennes",
        text: "Une sélection de coffee shops indépendants, choisis pour la qualité de leurs cafés.",
        illustration: require("../assets/onboarding1.png"),
    },
    {
        key: "2",
        title: "Articles & guides pour mieux déguster",
        text: "Origines, profils aromatiques, méthodes d’extraction…",
        illustration: require("../assets/onboarding2.png"),
    },
    {
        key: "3",
        title: "Scannez vos tickets et progressez",
        text: "Chaque visite vous fait gagner des badges et débloque de nouvelles possibilités.",
        illustration: require("../assets/onboarding3.png"),
    },
    {
        key: "4",
        title: "Participez à la communauté",
        text: "Liker, commenter, proposer des cafés : vos actions comptent.",
        illustration: require("../assets/onboarding4.png"),
    },
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
    const [index, setIndex] = React.useState(0);
    const isLast = index === slides.length - 1;

    const slide = slides[index];

    return (
        <View style={styles.container}>
            <Image source={slide.illustration} style={styles.illustration} resizeMode="contain" />

            <View style={styles.content}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.text}>{slide.text}</Text>

                <View style={styles.dots}>
                    {slides.map((s, i) => (
                        <View
                            key={s.key}
                            style={[styles.dot, i === index && styles.dotActive]}
                        />
                    ))}
                </View>

                <View style={styles.buttonsRow}>
                    {index < slides.length - 1 ? (
                        <TouchableOpacity onPress={onFinish}>
                            <Text style={styles.secondaryButton}>Passer</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 60 }} />
                    )}

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            if (isLast) onFinish();
                            else setIndex((prev) => prev + 1);
                        }}
                    >
                        <Text style={styles.primaryButtonText}>
                            {isLast ? "Commencer" : "Suivant"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1020",
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
    },
    illustration: {
        width: width - 48,
        height: "40%",
        alignSelf: "center",
    },
    content: {
        flex: 1,
        justifyContent: "space-between",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 8,
    },
    text: {
        fontSize: 15,
        color: "#B0B4C0",
        lineHeight: 22,
    },
    dots: {
        flexDirection: "row",
        gap: 8,
        marginTop: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: "#3A3F52",
    },
    dotActive: {
        width: 20,
        backgroundColor: "#C28A52",
    },
    buttonsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 32,
    },
    secondaryButton: {
        color: "#B0B4C0",
        fontSize: 15,
    },
    primaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: "#C28A52",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
});
