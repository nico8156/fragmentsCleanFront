import { View, Text, StyleSheet } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";

type Props = {
    name: string;
};

export const CoffeeMarkerLabel = ({ name }: Props) => (
    <View style={styles.textCard}>
        <Text style={styles.label} numberOfLines={1}>
            {name}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    textCard: {
		alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 5,
		maxWidth: 176,
        borderRadius: 6,
        backgroundColor: "rgba(244, 237, 230, 0.5)",
        marginTop: 6,
    },
    label: {
		maxWidth: 160,
		alignSelf: "center",
        fontSize: 14,
        fontWeight: "600",
        color: palette.elevated,
        textAlign: "center",
    },
});
