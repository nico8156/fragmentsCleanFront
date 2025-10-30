import {Stack, useLocalSearchParams} from "expo-router";
import {SafeAreaView, StyleSheet, Text, View} from "react-native";

export default function CoffeeDetailsScreen() {
    const {id} = useLocalSearchParams<{id?: string}>();

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Café' }} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.title}>Détails du café</Text>
                    <Text style={styles.subtitle}>Identifiant : {id}</Text>
                    <Text style={styles.description}>
                        Cette page affichera prochainement l’ensemble des informations du lieu : menu, horaires détaillés,
                        et avis des habitués.
                    </Text>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    container: {
        flex: 1,
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    subtitle: {
        fontSize: 16,
        color: '#6E6E73',
    },
    description: {
        fontSize: 15,
        color: '#3A3A3C',
        lineHeight: 22,
    },
});
