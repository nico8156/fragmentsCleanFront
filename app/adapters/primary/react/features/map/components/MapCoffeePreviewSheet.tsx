import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";

import { compactSheetPresentation } from "@/app/adapters/primary/react/components/design/Primitives";
import { compactSheetGeometry } from "@/app/adapters/primary/react/css/designTokens";
import { useBottomClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import BottomSheetPreviewSimple from "@/app/adapters/primary/react/features/map/components/BottomSheetPreviewSimple";

type Props = {
	bottomSheetRef: React.RefObject<BottomSheet | null>;

	index: number;
	onChange: (index: number) => void;
	onAnimate?: (fromIndex: number, toIndex: number) => void;

	snapPoints: (string | number)[];

	// contenu
	name?: string;
	isOpen?: boolean;
	distanceText?: string;
	todayHoursLabel?: string;
	onPressDetails: () => void;
	onPressDirections: () => void;
	canOpenDirections: boolean;
	isLoading?: boolean;
};

export default function MapCoffeePreviewSheet({
	bottomSheetRef,
	index,
	onChange,
	onAnimate,
	snapPoints,
	name,
	isOpen,
	distanceText,
	todayHoursLabel,
	onPressDetails,
	onPressDirections,
	canOpenDirections,
	isLoading,
}: Props) {
	const clearance = useBottomClearance();
	const { height } = useWindowDimensions();
	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={index}
			onChange={onChange}
			onAnimate={onAnimate}
			snapPoints={snapPoints}
			enablePanDownToClose
			enableOverDrag={false}
			enableDynamicSizing
			maxDynamicContentSize={height * compactSheetGeometry.maxHeightPercent / 100}
			keyboardBehavior={Platform.OS === "ios" ? "interactive" : "extend"}
			keyboardBlurBehavior="none"
			backgroundStyle={compactSheetPresentation}
		>
			<BottomSheetScrollView contentContainerStyle={[styles.sheetContent, { paddingBottom: clearance }]} showsVerticalScrollIndicator={false}>
				<BottomSheetPreviewSimple
					name={name}
					isOpen={isOpen}
					distanceText={distanceText}
					todayHoursLabel={todayHoursLabel}
					onPressDetails={onPressDetails}
					onPressDirections={onPressDirections}
					canOpenDirections={canOpenDirections}
					isLoading={isLoading}
				/>
			</BottomSheetScrollView>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	sheetContent: {
		minHeight: 200,
	},
});
