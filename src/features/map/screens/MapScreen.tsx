import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
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

export function MapScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const { coords, refresh } = useUserLocationFromStore();
    const mapRef = useRef<MapView>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [isFollowingUser, setIsFollowingUser] = useState(true);

    const initialRegion = useMemo<Region>(() => ({
        latitude: coords?.lat ?? 48.8566,
        longitude: coords?.lng ?? 2.3522,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
    }), [coords?.lat, coords?.lng]);

    const toggleViewMode = () => {
        setViewMode((mode) => (mode === 'map' ? 'list' : 'map'));
    };

    const updateFollowingState = useCallback((region: Region) => {
        if (!coords) return;
        const latDiff = Math.abs(region.latitude - coords.lat);
        const lngDiff = Math.abs(region.longitude - coords.lng);
        const threshold = 0.0008;
        setIsFollowingUser(latDiff < threshold && lngDiff < threshold);
    }, [coords]);

    const handleRegionChangeComplete = (region: Region) => {
        updateFollowingState(region);
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Carte des cafés</Text>
                        <Text style={styles.subtitle}>Autour de vous</Text>
                    </View>
                    <Pressable
                        onPress={toggleViewMode}
                        style={({ pressed }) => [
                            styles.toggleButton,
                            pressed && styles.toggleButtonPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={viewMode === 'map' ? 'Afficher la liste' : 'Afficher la carte'}
                    >
                        <SymbolView
                            name={viewMode === 'map' ? 'list.bullet.rectangle' : 'map.fill'}
                            size={22}
                            tintColor={'#1C1C1E'}
                        />
                    </Pressable>
                </View>
                <View style={styles.body}>
                    {viewMode === 'map' ? (
                        <View style={styles.mapCard}>
                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                showsMyLocationButton={false}
                                initialRegion={initialRegion}
                                showsUserLocation={true}
                                onRegionChangeComplete={handleRegionChangeComplete}
                                onPanDrag={handlePanDrag}
                            >
                                <CoffeeSelection />
                            </MapView>
                            <LocalisationButton
                                localizeMe={localizeMe}
                                name={isFollowingUser ? 'location.circle.fill' : 'location'}
                                size={28}
                                color={isFollowingUser ? '#0A84FF' : '#3A3A3C'}
                                isFollowing={isFollowingUser}
                            />
                        </View>
                    ) : (
                        <CoffeeList onSelectCoffee={(id) => openCafeDetails(String(id))} />
                    )}
                </View>
            </View>
            <ScanTicketFab onPress={openScanModal} insetBottom={insets.bottom} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: '#6E6E73',
    },
    toggleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(118,118,128,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleButtonPressed: {
        opacity: 0.75,
    },
    body: {
        flex: 1,
    },
    mapCard: {
        flex: 1,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
        elevation: 6,
        backgroundColor: '#FFFFFF',
    },
    map: {
        flex: 1,
        borderRadius: 28,
    },
});

export default MapScreen;
