import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { Pressable } from "react-native";
import { selectCurrentUser } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import { signOut } from "@/app/core-logic/contextWL/userWl/usecases/auth/authUsecases";
import { palette } from "@/app/adapters/primary/react/css/colors";

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
                    <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>{user?.profile?.name?.[0]?.toUpperCase() ?? 'F'}</Text>
                    </View>
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
        backgroundColor: palette.background,
    },
    container: {
        padding: 28,
        gap: 28,
    },
    header: {
        gap: 12,
        alignItems: 'center',
    },
    name: {
        fontSize: 26,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    email: {
        fontSize: 14,
        color: palette.textMuted,
    },
    card: {
        backgroundColor: palette.elevated,
        borderRadius: 28,
        padding: 24,
        gap: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: palette.textSecondary,
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
        color: palette.textPrimary,
    },
    rowSubtitle: {
        fontSize: 14,
        color: palette.textMuted,
    },
    signOutButton: {
        backgroundColor: palette.accent,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    signOutButtonPressed: {
        opacity: 0.8,
    },
    signOutLabel: {
        color: '#1C0E08',
        fontSize: 16,
        fontWeight: '600',
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: palette.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    avatarInitial: {
        fontSize: 32,
        fontWeight: '700',
        color: palette.textPrimary,
    },
});

export default ProfileScreen;
