import { Marker } from "react-native-maps";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCoffeeCoordinates } from "@/app/adapters/secondary/viewModel/useCoffeeCoordinates";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { View, StyleSheet, Text } from "react-native";
import { SymbolView } from "expo-symbols";
import { palette } from "@/constants/colors";
import {CafeFullVM, CoffeeOnMap} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";

type Props = {
    coffee: CoffeeOnMap ;
    onSelect?: (id: string) => void;
    selected?: boolean;
    zoomLevel: number;
};

const CoffeeMarker = (props: Props) => {
    const { coffee, selected, zoomLevel, onSelect } = props;
    const showExpanded = zoomLevel <= 0.015;
    //const likesCount = coffee?.rating ? Math.round(coffee.rating * 20) : undefined;
    const isOpen = useCafeOpenNow(parseToCoffeeId(coffee.id))
    const onpress = () => {
        onSelect?.(coffee.id)
    }
    return (
        <Marker
            coordinate={{ latitude: coffee.location.lat, longitude: coffee.location.lon }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={onpress}
        >
            <View style={styles.wrapper}>
                <View
                    style={[
                        styles.markerBody,
                        selected ? styles.markerBodySelected : undefined,
                        showExpanded ? styles.markerBodyExpanded : undefined,
                    ]}
                >
                    <View style={styles.iconWrapper}>
                        <SymbolView
                            name={isOpen ? "cup.and.saucer.fill" : "cup.and.saucer"}
                            size={20}
                            tintColor="#F4EDE6"
                        />
                    </View>
                    {showExpanded ? (
                        <View style={{flexDirection:"row", gap:8, marginLeft:8}}>
                            <Text style={styles.likesText}>{ 72}</Text>
                            <SymbolView name="heart.fill" size={18} tintColor={palette.accent} />
                        </View>
                    ) : null}
                </View>
                <View style={styles.textCard}>
                    <Text style={styles.label} numberOfLines={1}>
                        {coffee?.name ?? "Café"}
                    </Text>
                </View>
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
    markerBodyExpanded: {

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
        fontSize: 16,
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
    iconWrapper:{
        backgroundColor:palette.success,
        padding:4,
        borderRadius:999
    },
    textCard:{
        justifyContent:"center",
        alignItems:"center",
        padding:5,
        borderRadius:6,
        backgroundColor:'rgba(244, 237, 230, 0.5)'
    },
    label: {
        maxWidth: 160,
        fontSize: 14,
        fontWeight: "600",
        color: palette.elevated,
        textAlign: "center",
    },
});