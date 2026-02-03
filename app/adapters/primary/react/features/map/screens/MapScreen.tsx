import BottomSheet from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { Clusterer, isClusterFeature } from "react-native-clusterer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Region } from "react-native-maps";
import Animated from "react-native-reanimated";

import ActionButtonsWrapper from "@/app/adapters/primary/react/features/map/components/ActionButtonsWrapper";
import { ClusterBubble } from "@/app/adapters/primary/react/features/map/components/ClusterBubble";
import CoffeeMarker from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeMarker";
import LocalisationButton from "@/app/adapters/primary/react/features/map/components/coffeeSelection/localisationButton";
import MapCoffeePreviewSheet from "@/app/adapters/primary/react/features/map/components/MapCoffeePreviewSheet";
import ListViewForCoffees from "@/app/adapters/primary/react/features/map/screens/ListViewForCoffees";

import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { useCafeForMarkers } from "@/app/adapters/secondary/viewModel/useCoffeesForMarkers";
import { useDistanceToPoint } from "@/app/adapters/secondary/viewModel/useDistanceToPoint";
import { useUserLocationFromStore } from "@/app/adapters/secondary/viewModel/useUserLocation";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";

import { useBlurOverlay } from "@/app/adapters/primary/react/features/map/hook/useBlurOverlay";
import { useClusteredCoffeeMap } from "@/app/adapters/primary/react/features/map/hook/useClusteredCoffeeMap";
import { useCoffeePreviewSheet } from "@/app/adapters/primary/react/features/map/hook/useCoffeePreviewSheet";
import { useFollowUserOnMap } from "@/app/adapters/primary/react/features/map/hook/useFollowUserOnMap";

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function MapScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();

	// --- BottomSheet state
	const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
	const bottomSheetRef = useRef<BottomSheet | null>(null);
	const snapPoints = useMemo(() => ["40%"], []);

	// --- UI state
	const [viewMode, setViewMode] = useState<"map" | "list">("map");

	// --- Data
	const { coffees } = useCafeForMarkers();
	const { coords, refresh } = useUserLocationFromStore();
	const {
		mapRef,
		initialRegion,
		effectiveClusterRegion,
		zoomLevel,
		mapDimensions,
		onLayout,
		handleRegionChangeComplete,
		clusterData,
	} = useClusteredCoffeeMap({
		coffees,
		userCoords: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
	});

	// --- Follow user extracted
	const { isFollowingUser, updateFollowingState, handlePanDrag, localizeMe } = useFollowUserOnMap({
		mapRef,
		coords: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
		refresh,
		initialRegion,
	});

	// --- Coffee preview extracted (selection + open/close + navigate details)
	const { selectedCoffeeId, openCoffeePreview, closePreview, goToDetails } = useCoffeePreviewSheet({
		navigation,
		bottomSheetRef,
		setBottomSheetIndex,
	});

	// --- Selected coffee details
	const { coffee } = useCafeFull(selectedCoffeeId);
	const isOpen = useCafeOpenNow(selectedCoffeeId);

	const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;
	const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? "Horaires non disponibles";

	const { text: distanceText } = useDistanceToPoint(
		coffee?.location ? { lat: coffee.location.lat, lng: coffee.location.lon } : undefined,
	);

	// --- Blur extracted
	const isSheetOpen = bottomSheetIndex >= 0 && viewMode === "map";
	const {
		shouldRender: shouldRenderBlur,
		style: blurStyle,
		hideFast: hideBlurFast,
	} = useBlurOverlay(isSheetOpen);

	// --- Handlers
	const toggleViewMode = useCallback(() => {
		setBottomSheetIndex(-1);
		setViewMode((mode) => (mode === "map" ? "list" : "map"));
	}, []);

	const onRegionChangeComplete = useCallback(
		(region: Region) => {
			handleRegionChangeComplete(region);
			updateFollowingState(region);
		},
		[handleRegionChangeComplete, updateFollowingState],
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
					onSelect={() => openCoffeePreview(coffeeId)}
					coordinate={{ latitude: lat, longitude: lng }}
				/>
			);
		},
		[coffees, zoomLevel, openCoffeePreview, mapRef],
	);

	return (
		<GestureHandlerRootView style={styles.safeArea} onLayout={onLayout}>
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
							onRegionChangeComplete={onRegionChangeComplete}
							onPanDrag={handlePanDrag}
							showsPointsOfInterest={false}
							onPress={() => {
								if (isSheetOpen) closePreview();
							}}
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

						{shouldRenderBlur && (
							<Animated.View style={[StyleSheet.absoluteFill, blurStyle]} pointerEvents="none">
								<BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
							</Animated.View>
						)}

						<ActionButtonsWrapper toggleViewMode={toggleViewMode} />

						<LocalisationButton
							localizeMe={localizeMe}
							name={isFollowingUser ? "location.circle.fill" : "location"}
							size={28}
							color={isFollowingUser ? palette.accent : palette.textSecondary}
							isFollowing={isFollowingUser}
						/>

						<MapCoffeePreviewSheet
							bottomSheetRef={bottomSheetRef}
							index={bottomSheetIndex}
							onChange={setBottomSheetIndex}
							onAnimate={(fromIndex, toIndex) => {
								if (toIndex === -1) hideBlurFast();
							}}
							snapPoints={snapPoints}
							name={coffee?.name}
							isOpen={isOpen}
							distanceText={distanceText}
							todayHoursLabel={todayHoursLabel}
							onPressDetails={goToDetails}
						/>
					</>
				) : (
					<ListViewForCoffees toggleViewMode={toggleViewMode} />
				)}
			</View>
		</GestureHandlerRootView>
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
});

export default MapScreen;
