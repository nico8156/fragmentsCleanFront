import { Image, StyleSheet, Text, View } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";

interface ProfileHeroProps {
    avatarUrl: string;
    displayName: string;
    email: string;
}

export function ProfileHero({ avatarUrl, displayName, email }: ProfileHeroProps) {
    return (
        <View style={styles.wrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{email}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        gap: 8,
        paddingTop: 8,
        paddingBottom: 12,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    name: {
        fontSize: 28,
        fontWeight: "600",
        color: palette.text_90,
    },
    email: {
        fontSize: 18,
        fontWeight: "400",
        color: palette.text_90,
    },
});
