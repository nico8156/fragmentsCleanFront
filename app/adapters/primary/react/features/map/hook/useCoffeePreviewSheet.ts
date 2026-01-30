import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { CoffeeId, parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import BottomSheet from "@gorhom/bottom-sheet";
import React, { useCallback, useState } from "react";

export function useCoffeePreviewSheet(params: {
	navigation: RootStackNavigationProp;
	bottomSheetRef: React.RefObject<BottomSheet | null>;
	setBottomSheetIndex: (index: number) => void;
}) {
	const { navigation, bottomSheetRef, setBottomSheetIndex } = params;

	const [selectedCoffeeId, setSelectedCoffeeId] = useState<CoffeeId | null>(null);

	const openCoffeePreview = useCallback(
		(rawId: string) => {
			const coffeeId = parseToCoffeeId(rawId);
			if (!coffeeId) return;

			setSelectedCoffeeId(coffeeId);
			setBottomSheetIndex(0);

			requestAnimationFrame(() => {
				bottomSheetRef.current?.snapToIndex(0);
			});
		},
		[bottomSheetRef, setBottomSheetIndex],
	);

	const closePreview = useCallback(() => {
		setBottomSheetIndex(-1);
	}, [setBottomSheetIndex]);

	const goToDetails = useCallback(() => {
		if (!selectedCoffeeId) return;
		navigation.navigate("CafeDetails", { id: selectedCoffeeId.toString() });
	}, [navigation, selectedCoffeeId]);

	return {
		selectedCoffeeId,
		openCoffeePreview,
		closePreview,
		goToDetails,
	};
}

