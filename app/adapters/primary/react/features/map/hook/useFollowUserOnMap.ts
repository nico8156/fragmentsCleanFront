import { useCallback, useEffect, useRef, useState } from "react";
import MapView, { Region } from "react-native-maps";

type Coords = { lat: number; lng: number };

export function useFollowUserOnMap(params: {
	mapRef: React.RefObject<MapView | null>;
	coords?: Coords;
	refresh: () => void;
}) {
	const { mapRef, coords, refresh } = params;

	const [isFollowingUser, setIsFollowingUser] = useState(Boolean(coords));
	const hasCenteredInitialLocation = useRef(Boolean(coords));
	const followRequested = useRef(false);

	const centerOn = useCallback((nextCoords: Coords) => {
		mapRef.current?.animateToRegion({
			latitude: nextCoords.lat,
			longitude: nextCoords.lng,
			latitudeDelta: 0.015,
			longitudeDelta: 0.015,
		});
	}, [mapRef]);

	useEffect(() => {
		if (!coords) return;
		if (!hasCenteredInitialLocation.current || followRequested.current) {
			centerOn(coords);
			hasCenteredInitialLocation.current = true;
			followRequested.current = false;
			setIsFollowingUser(true);
		}
	}, [centerOn, coords]);

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
		followRequested.current = true;
		refresh();
		setIsFollowingUser(true);
		if (coords) centerOn(coords);
	}, [centerOn, coords, refresh]);

	return {
		isFollowingUser,
		updateFollowingState,
		handlePanDrag,
		localizeMe,
		setIsFollowingUser, // utile si tu veux forcer false ailleurs
	};
}
