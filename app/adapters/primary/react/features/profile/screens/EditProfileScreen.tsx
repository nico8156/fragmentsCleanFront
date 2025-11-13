import { StyleSheet, Text, TextInput, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { palette } from "@/app/adapters/primary/react/css/colors";

export function EditProfileScreen() {
    const { displayName, primaryEmail, avatarUrl, bio } = useAuthUser();

    return (
        <ProfileLayout title="EDIT PROFILE">
            <ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail ?? "Non renseigné"} />
            <ProfileCard title="Informations personnelles" subtitle="Visualise et prépare tes prochaines modifications.">
                <View style={styles.field}>
                    <Text style={styles.label}>Nom affiché</Text>
                    <TextInput value={displayName} editable={false} style={styles.input} />
                </View>
                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput value={primaryEmail ?? "Non renseigné"} editable={false} style={styles.input} />
                </View>
                {bio ? (
                    <View style={styles.field}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput value={bio} editable={false} style={[styles.input, styles.inputMultiline]} multiline />
                    </View>
                ) : null}
                <Text style={styles.helper}>Ces informations proviennent de ton profil Fragments. Elles peuvent être modifiées depuis l’application principale.</Text>
            </ProfileCard>
        </ProfileLayout>
    );
}

const styles = StyleSheet.create({
    field: {
        gap: 8,
    },
    label: {
        color: palette.textSecondary,
        fontSize: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: palette.textPrimary,
        backgroundColor: palette.bg_dark_10,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    helper: {
        fontSize: 12,
        color: palette.textSecondary,
    },
});

export default EditProfileScreen;
