import { useCallback, useState } from "react";
import MapView, { Region } from "react-native-maps";

type Coords = { lat: number; lng: number };

export function useFollowUserOnMap(params: {
	mapRef: React.RefObject<MapView | null>;
	coords?: Coords;
	refresh: () => void;
	initialRegion: Region;
}) {
	const { mapRef, coords, refresh, initialRegion } = params;

	const [isFollowingUser, setIsFollowingUser] = useState(false);

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
	}, [coords?.lat, coords?.lng, initialRegion.latitude, initialRegion.longitude, mapRef, refresh]);

	return {
		isFollowingUser,
		updateFollowingState,
		handlePanDrag,
		localizeMe,
		setIsFollowingUser, // utile si tu veux forcer false ailleurs
	};
}

