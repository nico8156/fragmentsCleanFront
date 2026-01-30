import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { coordsToGeoJSONFeature } from "react-native-clusterer";
import MapView, { Region } from "react-native-maps";

type LatLng = { lat: number; lng: number };

type CoffeeMarkerVM = {
	id: string;
	name: string;
	location: { lat: number; lon: number };
};

const expandRegion = (region: Region, factor = 0.2): Region => ({
	...region,
	latitudeDelta: region.latitudeDelta * (1 + factor),
	longitudeDelta: region.longitudeDelta * (1 + factor),
});

export function useClusteredCoffeeMap(params: {
	coffees: CoffeeMarkerVM[];
	userCoords?: LatLng;
	initialFallback?: { lat: number; lng: number };
}) {
	const { coffees, userCoords, initialFallback = { lat: 48.8566, lng: 2.3522 } } = params;

	const mapRef = useRef<MapView>(null);

	const [mapRegion, setMapRegion] = useState<Region | undefined>();
	const [clusterRegion, setClusterRegion] = useState<Region | undefined>(undefined);

	const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

	const clusterUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const initialRegion = useMemo<Region>(
		() => ({
			latitude: userCoords?.lat ?? initialFallback.lat,
			longitude: userCoords?.lng ?? initialFallback.lng,
			latitudeDelta: 0.035,
			longitudeDelta: 0.035,
		}),
		[userCoords?.lat, userCoords?.lng, initialFallback.lat, initialFallback.lng],
	);

	const effectiveClusterRegion = clusterRegion ?? initialRegion;
	const zoomLevel = (mapRegion ?? initialRegion).latitudeDelta;

	const onLayout = useCallback((e: any) => {
		const { width: w, height: h } = e.nativeEvent.layout;
		setMapDimensions({ width: w, height: h });
	}, []);

	const handleRegionChangeComplete = useCallback((nextRegion: Region) => {
		setMapRegion(nextRegion);

		if (clusterUpdateTimeout.current) clearTimeout(clusterUpdateTimeout.current);

		clusterUpdateTimeout.current = setTimeout(() => {
			setClusterRegion(expandRegion(nextRegion, 0.2));
		}, 120);
	}, []);

	const clusterData = useMemo<any[]>(
		() =>
			coffees.map((c) =>
				coordsToGeoJSONFeature(
					{ lat: c.location.lat, lng: c.location.lon },
					{ id: c.id, name: c.name },
				),
			),
		[coffees],
	);

	useEffect(() => {
		return () => {
			if (clusterUpdateTimeout.current) clearTimeout(clusterUpdateTimeout.current);
		};
	}, []);

	return {
		mapRef,
		initialRegion,
		effectiveClusterRegion,
		zoomLevel,
		mapDimensions,
		onLayout,
		handleRegionChangeComplete,
		clusterData,
	};
}

