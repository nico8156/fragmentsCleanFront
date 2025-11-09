import { View, StyleSheet, Text } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import { SymbolView } from "expo-symbols";

import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { CoffeeOnMap } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import {CoffeeMarkerBubble} from "@/app/adapters/primary/react/components/coffeeSelection/CoffeeMarkerBubble";
import {CoffeeMarkerLabel} from "@/app/adapters/primary/react/components/coffeeSelection/CoffeeMarkerLabel";

type Props = {
    coffee: CoffeeOnMap;
    onSelect?: () => void;       // 🔹 plus simple : callback sans argument
    selected?: boolean;
    zoomLevel: number;
    coordinate: LatLng;          // 🔹 fourni par le clusterer
};

function CoffeeMarker(props: Props) {
    const { coffee, selected, zoomLevel, onSelect, coordinate } = props;

    const showExpanded = zoomLevel <= 0.015;
    const isOpen = useCafeOpenNow(parseToCoffeeId(coffee.id));

    const handlePress = () => {
        onSelect?.();
    };

    return (
        <Marker
            coordinate={coordinate}            // 🔹 on utilise la prop
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={handlePress}
        >
            <CoffeeMarkerBubble isOpen={isOpen} showExpanded={showExpanded} selected={selected} />
            <CoffeeMarkerLabel name={coffee?.name ?? "Café"} />
        </Marker>
    );
}

// 🔹 composant mémoïsé
export default CoffeeMarker;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        gap: 6,
    },
    markerBody: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 3,
        paddingVertical: 3,
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
    markerBodyExpanded: {},
    markerBodySelected: {
        backgroundColor: palette.accentMuted,
        borderColor: palette.accent,
    },
    likesText: {
        fontSize: 16,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    iconWrapper: {
        backgroundColor: palette.success,
        padding: 4,
        borderRadius: 999,
    },
    textCard: {
        justifyContent: "center",
        alignItems: "center",
        padding: 5,
        borderRadius: 6,
        backgroundColor: "rgba(244, 237, 230, 0.5)",
    },
    label: {
        maxWidth: 160,
        fontSize: 14,
        fontWeight: "600",
        color: palette.elevated,
        textAlign: "center",
    },
});
