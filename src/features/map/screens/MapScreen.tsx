import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import MapView, { Region } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { SymbolView } from "expo-symbols";
import CoffeeSelection from "@/app/adapters/primary/react/components/coffeeSelection/coffeeSelection";
import LocalisationButton from "@/app/adapters/primary/react/components/coffeeSelection/localisationButton";
import CoffeeList from "@/app/adapters/primary/react/components/coffeeSelection/coffeeList";
import { useUserLocationFromStore } from "@/app/adapters/secondary/viewModel/useUserLocation";
import { ScanTicketFab } from "@/src/features/scan/components/ScanTicketFab";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CafeBottomSheet } from "@/src/features/map/components/CafeBottomSheet";
import { palette } from "@/constants/colors";

export function MapScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const { coords, refresh } = useUserLocationFromStore();
    const mapRef = useRef<MapView>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
    const [region, setRegion] = useState<Region>();

    const initialRegion = useMemo<Region>(() => ({
        latitude: coords?.lat ?? 48.8566,
        longitude: coords?.lng ?? 2.3522,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
    }), [coords?.lat, coords?.lng]);

    const toggleViewMode = () => {
        setViewMode((mode) => {
            if (mode === 'map') {
                setSelectedCoffeeId(null);
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

    const openScanModal = () => {
        navigation.navigate("ScanTicketModal");
    };

    const openCafeDetails = (id: string) => {
        navigation.navigate("CafeDetails", { id });
    };

    const zoomLevel = region?.latitudeDelta ?? initialRegion.latitudeDelta;

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.container}>
                {viewMode === 'map' ? (
                    <>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            showsMyLocationButton={false}
                            initialRegion={initialRegion}
                            showsUserLocation={true}
                            onRegionChangeComplete={handleRegionChangeComplete}
                            onPanDrag={handlePanDrag}
                            onPress={() => setSelectedCoffeeId(null)}
                            showsPointsOfInterest={false}
                        >
                            <CoffeeSelection
                                onSelect={(id) => setSelectedCoffeeId(id)}
                                selectedId={selectedCoffeeId}
                                zoomLevel={zoomLevel}
                            />
                        </MapView>
                        <View style={[styles.overlayHeader, { paddingTop: insets.top + 18 }]}>
                            <View>
                                <Text style={styles.overlayLabel}>Explorer</Text>
                                <Text style={styles.overlayTitle}>Cafés de spécialité</Text>
                            </View>
                            <Pressable
                                onPress={toggleViewMode}
                                style={styles.overlayToggle}
                                accessibilityRole="button"
                                accessibilityLabel="Afficher la liste"
                            >
                                <SymbolView name={'list.bullet.rectangle'} size={22} tintColor={palette.textPrimary} />
                            </Pressable>
                        </View>
                        <LocalisationButton
                            localizeMe={localizeMe}
                            name={isFollowingUser ? 'location.circle.fill' : 'location'}
                            size={28}
                            color={isFollowingUser ? palette.accent : palette.textSecondary}
                            isFollowing={isFollowingUser}
                        />
                        <CafeBottomSheet coffeeId={selectedCoffeeId} onRequestClose={() => setSelectedCoffeeId(null)} />
                    </>
                ) : (
                    <View style={[styles.listWrapper, { paddingTop: insets.top + 16 }]}>
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>Tous les cafés</Text>
                            <Pressable onPress={toggleViewMode} style={styles.overlayToggle} accessibilityRole="button">
                                <SymbolView name={'map.fill'} size={22} tintColor={palette.textPrimary} />
                            </Pressable>
                        </View>
                        <CoffeeList onSelectCoffee={(id) => openCafeDetails(String(id))} />
                    </View>
                )}
            </View>
            <ScanTicketFab onPress={openScanModal} insetBottom={insets.bottom} />
        </View>
    );
}

const styles = StyleSheet.create({
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
    listWrapper: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 20,
        backgroundColor: palette.background,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: palette.textPrimary,
    },
});

export default MapScreen;
