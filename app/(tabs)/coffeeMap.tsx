import { StyleSheet, View, Text, Pressable, SafeAreaView } from "react-native";
import MapView, { Region } from "react-native-maps";
import CoffeeSelection from "@/app/adapters/primary/react/components/coffeeSelection/coffeeSelection";
import LocalisationButton from "@/app/adapters/primary/react/components/coffeeSelection/localisationButton";
import CoffeeList from "@/app/adapters/primary/react/components/coffeeSelection/coffeeList";
import { useMemo, useRef, useState, useCallback } from "react";
import {useUserLocationFromStore} from "@/app/adapters/secondary/viewModel/useUserLocation";
import { SymbolView } from "expo-symbols";

const CoffeeMap = () => {

    const {coords,refresh} = useUserLocationFromStore()

    const mapRef = useRef<MapView>(null)
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
    const [isFollowingUser, setIsFollowingUser] = useState(true)

    const initialRegion = useMemo<Region>(() => ({
        latitude: coords?.lat ?? 48.8566,
        longitude: coords?.lng ?? 2.3522,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
    }), [coords?.lat, coords?.lng])

    const toggleViewMode = () => {
        setViewMode((mode) => (mode === 'map' ? 'list' : 'map'))
    }

    const updateFollowingState = useCallback((region: Region) => {
        if (!coords) return
        const latDiff = Math.abs(region.latitude - coords.lat)
        const lngDiff = Math.abs(region.longitude - coords.lng)
        const threshold = 0.0008
        setIsFollowingUser(latDiff < threshold && lngDiff < threshold)
    }, [coords])

    const handleRegionChangeComplete = (region: Region) => {
        updateFollowingState(region)
    }

    const handlePanDrag = () => {
        setIsFollowingUser(false)
    }

    const localizeMe = () => {
        refresh()
        setIsFollowingUser(true)
        mapRef.current?.animateToRegion({
            latitude: coords?.lat ?? initialRegion.latitude,
            longitude: coords?.lng ?? initialRegion.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
        });
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Carte des cafés</Text>
                        <Text style={styles.subtitle}>Autour de vous</Text>
                    </View>
                    <Pressable
                        accessibilityRole={'button'}
                        onPress={toggleViewMode}
                        style={styles.toggleButton}
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
                                <CoffeeSelection/>
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
                        <CoffeeList/>
                    )}
                </View>
            </View>
        </SafeAreaView>
    )
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
})
export default CoffeeMap;