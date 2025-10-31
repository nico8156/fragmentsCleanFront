import {StyleSheet, Text, View} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";

export function WelcomeMessage() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gagne des badges en savourant tes cafés préférés ! ☕🏅</Text>
            <Text style={styles.paragraph}>
                Chez <Text style={styles.highlight}>Fragments</Text>, chaque visite dans un café, c’est plus qu’une simple pause café —
                c’est aussi l’occasion de collectionner des badges !
            </Text>
            <Text style={styles.paragraph}>Comment ça marche ? C’est simple :</Text>
            <Text style={styles.list}>💡 À chaque fois que tu dégustes un café, garde ton ticket d’achat.</Text>
            <Text style={styles.list}>
                📸 Scanne-le directement depuis l’application en cliquant sur l’icône :{' '}
                <MaterialIcons name="document-scanner" size={18} color="#6B6B6B" />
            </Text>
            <Text style={styles.list}>✨ Plus tu cumules de tickets, plus tu débloques des badges exclusifs !</Text>
            <Text style={styles.paragraph}>
                Une façon fun de marquer ta passion pour les bons cafés et de découvrir de nouveaux endroits.
            </Text>
            <Text style={styles.cta}>Alors, prêt·e à transformer tes moments café en trophées ? Commence ta collection dès aujourd’hui !</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 24,
        marginBottom: 48,
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1F1F1F",
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 20,
        color: "#454545",
        marginBottom: 12,
    },
    highlight: {
        fontWeight: "700",
        color: "#4F46E5",
    },
    list: {
        fontSize: 14,
        lineHeight: 20,
        color: "#2D2D2D",
        marginBottom: 8,
    },
    cta: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2937",
        marginTop: 12,
    },
});
