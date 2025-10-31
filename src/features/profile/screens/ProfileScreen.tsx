import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { Pressable } from "react-native";
import { selectCurrentUser } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import { signOut } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";

export function ProfileScreen() {
    const dispatch = useDispatch<any>();
    const user = useSelector(selectCurrentUser);

    const handleSignOut = useCallback(() => {
        dispatch(signOut());
    }, [dispatch]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.name}>{user?.profile?.name ?? 'Invité·e'}</Text>
                    <Text style={styles.email}>{user?.email ?? 'Non renseigné'}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Compte</Text>
                    <Text style={styles.cardSubtitle}>
                        Gère tes préférences, ta sécurité et l’accès à tes cafés favoris.
                    </Text>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.rowTitle}>Statut</Text>
                            <Text style={styles.rowSubtitle}>
                                {user ? 'Connecté' : 'Hors connexion'}
                            </Text>
                        </View>
                    </View>
                </View>
                <Pressable style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]} onPress={handleSignOut}>
                    <Text style={styles.signOutLabel}>Se déconnecter</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    container: {
        padding: 24,
        gap: 24,
    },
    header: {
        gap: 4,
    },
    name: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    email: {
        fontSize: 14,
        color: '#6E6E73',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        gap: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6E6E73',
        lineHeight: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    rowSubtitle: {
        fontSize: 14,
        color: '#6E6E73',
    },
    signOutButton: {
        backgroundColor: '#1C1C1E',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    signOutButtonPressed: {
        opacity: 0.8,
    },
    signOutLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;
