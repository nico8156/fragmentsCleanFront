import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, useWindowDimensions, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { BottomSheet, Host } from "@expo/ui/swift-ui";
import { Clusterer, coordsToGeoJSONFeature, isClusterFeature } from "react-native-clusterer";

import LocalisationButton from "@/app/adapters/primary/react/features/map/components/coffeeSelection/localisationButton";
import CoffeeMarker from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeMarker";

import { useUserLocationFromStore } from "@/app/adapters/secondary/viewModel/useUserLocation";
import { useCafeForMarkers } from "@/app/adapters/secondary/viewModel/useCoffeesForMarkers";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { useDistanceToPoint } from "@/app/adapters/secondary/viewModel/useDistanceToPoint";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { CoffeeId, parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

import ListViewForCoffees from "@/app/adapters/primary/react/features/map/screens/ListViewForCoffees";
import ActionButtonsWrapper from "@/app/adapters/primary/react/features/map/components/ActionButtonsWrapper";
import BottomSheetHeader from "@/app/adapters/primary/react/features/map/components/BottomSheetHeader";
import BottomSheetCat from "@/app/adapters/primary/react/features/map/components/BottomSheetCat";
import BottomSheetActions from "@/app/adapters/primary/react/features/map/components/BottomSheetActions";
import BottomSheetPhotos from "@/app/adapters/primary/react/features/map/components/BottomSheetPhotos";
import BottomSheetGeneral from "@/app/adapters/primary/react/features/map/components/BottomSheetGeneral";
import CommentsArea from "@/app/adapters/primary/react/features/map/components/CommentsArea";
import Separator from "@/app/adapters/primary/react/features/map/components/Separator";
import GeneralComponent from "@/app/adapters/primary/react/features/map/components/GeneralComponent";
import TagComponent from "@/app/adapters/primary/react/features/map/components/TagComponent";
import { ClusterBubble } from "@/app/adapters/primary/react/features/map/components/ClusterBubble";

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type LatLng = { lat: number; lng: number };

const expandRegion = (region: Region, factor = 0.2): Region => ({
    ...region,
    latitudeDelta: region.latitudeDelta * (1 + factor),
    longitudeDelta: region.longitudeDelta * (1 + factor),
});

export function MapScreen() {
    const [selectedCoffeeId, setSelectedCoffeeId] = useState<CoffeeId | null>(null);
    const [viewMode, setViewMode] = useState<"map" | "list">("map");
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

    const [mapRegion, setMapRegion] = useState<Region | undefined>();
    const [clusterRegion, setClusterRegion] = useState<Region | undefined>(undefined);
    const clusterUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

    const mapRef = useRef<MapView>(null);
    const { width } = useWindowDimensions();

    const { coffees } = useCafeForMarkers();
    const { coords, refresh } = useUserLocationFromStore();
    const { coffee } = useCafeFull(selectedCoffeeId);
    const isOpen = useCafeOpenNow(selectedCoffeeId);

    const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;
    const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? "Horaires non disponibles";

    const { text: distanceText } = useDistanceToPoint(
        { lat: coffee?.location.lat, lng: coffee?.location.lon } as LatLng,
    );

    const initialRegion = useMemo<Region>(
        () => ({
            latitude: coords?.lat ?? 48.8566,
            longitude: coords?.lng ?? 2.3522,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
        }),
        [coords?.lat, coords?.lng],
    );

    // si clusterRegion n'est pas encore défini, on part sur initialRegion
    const effectiveClusterRegion = clusterRegion ?? initialRegion;
    const zoomLevel = (mapRegion ?? initialRegion).latitudeDelta;

    const updateFollowingState = useCallback(
        (region: Region) => {
            if (!coords) return;
            const latDiff = Math.abs(region.latitude - coords.lat);
            const lngDiff = Math.abs(region.longitude - coords.lng);
            const threshold = 0.0008;
            setIsFollowingUser(latDiff < threshold && lngDiff < threshold);
        },
        [coords],
    );

    const handleRegionChangeComplete = useCallback(
        (nextRegion: Region) => {
            setMapRegion(nextRegion);
            updateFollowingState(nextRegion);

            if (clusterUpdateTimeout.current) {
                clearTimeout(clusterUpdateTimeout.current);
            }

            clusterUpdateTimeout.current = setTimeout(() => {
                setClusterRegion(expandRegion(nextRegion, 0.2));
            }, 120);
        },
        [updateFollowingState],
    );

    const handlePanDrag = useCallback(() => {
        setIsFollowingUser(false);
    }, []);

    const localizeMe = useCallback(() => {
        refresh();
        setIsFollowingUser(true);
        mapRef.current?.animateToRegion({
            latitude: coords?.lat ?? initialRegion.latitude,
            longitude: coords?.lng ?? initialRegion.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
        });
    }, [coords?.lat, coords?.lng, initialRegion.latitude, initialRegion.longitude, refresh]);

    const toggleViewMode = useCallback(() => {
        setViewMode((mode) => (mode === "map" ? "list" : "map"));
    }, []);

    const handleSelectCoffee = useCallback((id: string) => {
        const coffeeId = parseToCoffeeId(id);
        if (!coffeeId) return;
        setSelectedCoffeeId(coffeeId);
        setIsBottomSheetOpen(true);
    }, []);

    const clusterData = useMemo<any[]>(
        () =>
            coffees.map((c) =>
                coordsToGeoJSONFeature(
                    { lat: c.location.lat, lng: c.location.lon },
                    {
                        id: c.id,
                        name: c.name,
                    },
                ),
            ),
        [coffees],
    );

    const renderClusterItem = useCallback(
        (item: any) => {
            const [lng, lat] = item.geometry.coordinates;

            if (isClusterFeature(item)) {
                const count = item.properties.point_count as number;

                const handleClusterPress = () => {
                    const toRegion = item.properties.getExpansionRegion();
                    mapRef.current?.animateToRegion(toRegion, 350);
                };

                return (
                    <Marker
                        key={`cluster-${item.properties.cluster_id}`}
                        coordinate={{ latitude: lat, longitude: lng }}
                        onPress={handleClusterPress}
                    >
                        <ClusterBubble count={count} />
                    </Marker>
                );
            }

            const coffeeId = item.properties.id as string;
            const coffeeItem = coffees.find((c) => c.id === coffeeId);
            if (!coffeeItem) return null;

            return (
                <CoffeeMarker
                    key={coffeeId}
                    coffee={coffeeItem}
                    zoomLevel={zoomLevel}
                    onSelect={() => handleSelectCoffee(coffeeId)}
                    coordinate={{ latitude: lat, longitude: lng }}
                />
            );
        },
        [coffees, zoomLevel, handleSelectCoffee],
    );

    // clean timeout on unmount
    useEffect(() => {
        return () => {
            if (clusterUpdateTimeout.current) {
                clearTimeout(clusterUpdateTimeout.current);
            }
        };
    }, []);

    return (
        <View
            style={styles.safeArea}
            onLayout={(e) => {
                const { width: w, height: h } = e.nativeEvent.layout;
                setMapDimensions({ width: w, height: h });
            }}
        >
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <View style={styles.container}>
                {viewMode === "map" ? (
                    <>
                        <MapView
                            ref={mapRef}
                            style={StyleSheet.absoluteFill}
                            showsMyLocationButton={false}
                            initialRegion={initialRegion}
                            showsUserLocation
                            onRegionChangeComplete={handleRegionChangeComplete}
                            onPanDrag={handlePanDrag}
                            showsPointsOfInterest={false}
                        >
                            {mapDimensions.width > 0 && mapDimensions.height > 0 && (
                                <Clusterer
                                    data={clusterData}
                                    region={effectiveClusterRegion}
                                    mapDimensions={mapDimensions}
                                    renderItem={renderClusterItem as any}
                                />
                            )}
                        </MapView>

                        <Host
                            matchContents
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    width,
                                    pointerEvents: "none",
                                },
                            ]}
                        >
                            <BottomSheet
                                isOpened={isBottomSheetOpen}
                                onIsOpenedChange={setIsBottomSheetOpen}
                                presentationDetents={["medium", "large"]}
                                presentationDragIndicator="visible"
                            >
                                {isBottomSheetOpen && (
                                    <ScrollView style={styles.sheetContent}>
                                        <BottomSheetHeader name={coffee?.name} />
                                        <BottomSheetCat
                                            openingHoursToday={todayHoursLabel}
                                            isOpen={isOpen}
                                            distance={distanceText}
                                        />
                                        <BottomSheetActions />
                                        <BottomSheetPhotos photos={coffee?.photos} />
                                        <BottomSheetGeneral />
                                        <Separator />
                                        <GeneralComponent
                                            isOpen={isOpen}
                                            address={coffee?.address}
                                            openingTodayHours={todayHoursLabel}
                                        />
                                        <Separator />
                                        <TagComponent />
                                        <Separator />
                                        <CommentsArea />
                                    </ScrollView>
                                )}
                            </BottomSheet>
                        </Host>

                        <ActionButtonsWrapper toggleViewMode={toggleViewMode} />

                        <LocalisationButton
                            localizeMe={localizeMe}
                            name={isFollowingUser ? "location.circle.fill" : "location"}
                            size={28}
                            color={isFollowingUser ? palette.accent : palette.textSecondary}
                            isFollowing={isFollowingUser}
                        />
                    </>
                ) : (
                    <ListViewForCoffees toggleViewMode={toggleViewMode} />
                )}
            </View>
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
    sheetContent: {
        flex: 1,
        backgroundColor: palette.textPrimary_1,
    },
});

export default MapScreen;
