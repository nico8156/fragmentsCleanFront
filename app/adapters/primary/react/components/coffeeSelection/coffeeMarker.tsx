import { Marker } from "react-native-maps";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCoffeeCoordinates } from "@/app/adapters/secondary/viewModel/useCoffeeCoordinates";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { View, StyleSheet, Text } from "react-native";
import { SymbolView } from "expo-symbols";
import { palette } from "@/constants/colors";

type Props = {
    id: string;
    onSelect?: (id: string) => void;
    selected?: boolean;
    zoomLevel: number;
};

const CoffeeMarker = ({ id, onSelect, selected = false, zoomLevel }: Props) => {
    const coffeeId = parseToCoffeeId(id);
    const { lat, lon } = useCoffeeCoordinates(coffeeId);
    const { coffee } = useCafeFull(coffeeId);
    const isOpen = useCafeOpenNow(coffeeId);

    const showExpanded = zoomLevel <= 0.03;
    const likesCount = coffee?.rating ? Math.round(coffee.rating * 20) : undefined;

    return (
        <Marker
            coordinate={{ latitude: lat, longitude: lon }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={() => onSelect?.(id)}
        >
            <View style={styles.wrapper}>
                <View
                    style={[
                        styles.markerBody,
                        selected ? styles.markerBodySelected : undefined,
                        showExpanded ? styles.markerBodyExpanded : undefined,
                    ]}
                >
                    <SymbolView
                        name={isOpen ? "cup.and.saucer.fill" : "cup.and.saucer"}
                        size={18}
                        tintColor="#F4EDE6"
                    />
                    {showExpanded ? (
                        <View style={styles.likesPill}>
                            <SymbolView name="heart.fill" size={14} tintColor={palette.accent} />
                            <Text style={styles.likesText}>{likesCount ?? 0}</Text>
                        </View>
                    ) : null}
                </View>
                <View style={[styles.tip, selected ? styles.tipSelected : undefined]} />
                <Text style={styles.label} numberOfLines={1}>
                    {coffee?.name ?? "Café"}
                </Text>
            </View>
        </Marker>
    );
};

export default CoffeeMarker;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        gap: 6,
    },
    markerBody: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: "rgba(28, 21, 17, 0.92)",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    markerBodyExpanded: {
        paddingHorizontal: 18,
    },
    markerBodySelected: {
        backgroundColor: palette.accentMuted,
        borderColor: palette.accent,
    },
    likesPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(200, 106, 58, 0.14)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    likesText: {
        fontSize: 12,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    tip: {
        width: 12,
        height: 12,
        backgroundColor: "rgba(28, 21, 17, 0.92)",
        transform: [{ rotate: "45deg" }],
        marginTop: -12,
        borderRadius: 3,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.05)",
    },
    tipSelected: {
        backgroundColor: palette.accentMuted,
        borderColor: palette.accent,
    },
    label: {
        maxWidth: 160,
        fontSize: 12,
        fontWeight: "600",
        color: palette.textPrimary,
        textAlign: "center",
    },
});