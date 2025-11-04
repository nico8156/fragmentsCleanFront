import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, useWindowDimensions, View, Text} from "react-native";
import MapView, { Region } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { SymbolView } from "expo-symbols";
import CoffeeSelection from "@/app/adapters/primary/react/components/coffeeSelection/coffeeSelection";
import LocalisationButton from "@/app/adapters/primary/react/components/coffeeSelection/localisationButton";
import { useUserLocationFromStore } from "@/app/adapters/secondary/viewModel/useUserLocation";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@/constants/colors";
import ListViewForCoffees from "@/src/features/map/screens/ListViewForCoffees";
import ActionButtonsWrapper from "@/src/features/map/components/ActionButtonsWrapper";
import {CoffeeId, parseToCoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {BottomSheet, Host} from "@expo/ui/swift-ui";
import {useCafeFull} from "@/app/adapters/secondary/viewModel/useCafeFull";
import CoffeeBottomSheet from "@/src/features/map/components/CoffeeBottomSheet";
import {useCafeForMarkers} from "@/app/adapters/secondary/viewModel/useCoffeesForMarkers";
import CoffeeMarker from "@/app/adapters/primary/react/components/coffeeSelection/coffeeMarker";

export function MapScreen() {
    const {width} = useWindowDimensions()
    const {coffees} = useCafeForMarkers()

    const navigation = useNavigation<RootStackNavigationProp>();

    const { coords, refresh } = useUserLocationFromStore();
    const mapRef = useRef<MapView>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [region, setRegion] = useState<Region>();

    const [isSheetOpened, setIsSheetOpened] = useState(false);
    const [selectedCoffeeId, setSelectedCoffeeId] = useState<CoffeeId | null>(null);
    const {coffee} = useCafeFull(selectedCoffeeId)
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);


    const initialRegion = useMemo<Region>(() => ({
        latitude: coords?.lat ?? 48.8566,
        longitude: coords?.lng ?? 2.3522,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
    }), [coords?.lat, coords?.lng]);

    const toggleViewMode = () => {
        setViewMode((mode) => {
            if (mode === 'map') {
                // setSelectedCoffeeId(null);
                // setIsBottomSheetOpen(false);
                return 'list';
            }
            return 'map';
        });
    };

    const updateFollowingState = useCallback((region: Region) => {
        if (!coords) return;
        const latDiff = Math.abs(region.latitude - coords.lat);
        const lngDiff = Math.abs(region.longitude - coords.lng);
        const threshold = 0.0008;
        setIsFollowingUser(latDiff < threshold && lngDiff < threshold);
    }, [coords]);

    const handleRegionChangeComplete = (nextRegion: Region) => {
        setRegion(nextRegion);
        updateFollowingState(nextRegion);
    };

    const handlePanDrag = () => {
        setIsFollowingUser(false);
    };

    const localizeMe = () => {
        refresh();
        setIsFollowingUser(true);
        mapRef.current?.animateToRegion({
            latitude: coords?.lat ?? initialRegion.latitude,
            longitude: coords?.lng ?? initialRegion.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
        });
    };

    const [estOuvert, setestOuvert] = useState(false);
    const doSmthgWithCoffee = async (id:string) => {
        setestOuvert(prevState => !prevState)
        const coffeeId = parseToCoffeeId(id);
        if (!coffeeId) return;
        setSelectedCoffeeId(coffeeId);
    }

    const zoomLevel = region?.latitudeDelta ?? initialRegion.latitudeDelta;

    const toggleSheet = () => {
        console.log("toggle sheet")
        setestOuvert(prevState => !prevState)
    };

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <View style={styles.container}>
                {viewMode === 'map' ? (
                    <>
                        <MapView
                            ref={mapRef}
                            style={StyleSheet.absoluteFill}
                            showsMyLocationButton={false}
                            initialRegion={initialRegion}
                            showsUserLocation={true}
                            onRegionChangeComplete={handleRegionChangeComplete}
                            onPanDrag={handlePanDrag}
                            showsPointsOfInterest={false}
                        >
                            {coffees.map(c=> (
                                <CoffeeMarker
                                    key={c.id}
                                    coffee={c}
                                    zoomLevel={zoomLevel}
                                    onSelect={() => doSmthgWithCoffee(c.id)}/>
                            ))}
                        </MapView>
                        <Host
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    width,
                                    pointerEvents: "none", // laisse passer les interactions hors de la sheet
                                },
                            ]}
                        >
                            <BottomSheet
                                isOpened={estOuvert}
                                onIsOpenedChange={(isOpened) => {
                                    setestOuvert(isOpened)
                                }}
                                presentationDetents={["medium", "large"]}
                                presentationDragIndicator="visible"
                            >
                                {estOuvert &&
                                <View style={styles.sheetContent}>
                                    <Text style={styles.sheetTitle}>Hello depuis la BottomSheet 👋</Text>
                                    <Text>Tu peux fermer en swipant vers le bas, ou avec le bouton ci-dessous.</Text>
                                    {selectedCoffeeId != null ?
                                        <Text>{coffee?.name}</Text> : <Text> NON pas de cafe</Text>
                                    }
                                    <Pressable onPress={toggleSheet} style={styles.innerButton}>
                                        <Text style={styles.innerButtonText}>Fermer</Text>
                                    </Pressable>
                                </View>
                                }
                            </BottomSheet>
                        </Host>
                        <ActionButtonsWrapper/>
                    </>
                ) : (
                    <ListViewForCoffees/>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonText: {
        color: "white",
        fontWeight: "600",
    },
    sheetContent: {
        padding: 16,
        gap: 12,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    innerButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "black",
        alignSelf: "flex-start",
    },
    innerButtonText: {
        color: "white",
        fontWeight: "600",
    },
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    overlayLabel: {
        color: palette.textMuted,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        fontSize: 12,
    },
    overlayTitle: {
        marginTop: 6,
        fontSize: 26,
        fontWeight: '800',
        color: palette.textPrimary,
    },
    overlayToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(33, 24, 19, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    buttonContainer: {
        position: "absolute",
        top: 60,
        right: 20,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.8)",
    },

});

export default MapScreen;
