import { StyleSheet, Text, View } from "react-native";

import SvgComponent from "@/app/adapters/primary/react/features/map/components/SvgComponent";
import { palette } from "@/app/adapters/primary/react/css/colors";

interface ProfileCoffeeBadgeProps {
    label: string;
}

export function ProfileCoffeeBadge({ label }: ProfileCoffeeBadgeProps) {
    return (
        <View style={styles.wrapper}>
            <SvgComponent coffeeId={undefined} width={70} height={70} />
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    label: {
        color: palette.primary_90,
        fontWeight: "bold",
        fontSize: 16,
    },
});
