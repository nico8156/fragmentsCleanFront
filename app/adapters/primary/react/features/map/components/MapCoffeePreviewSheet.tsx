import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import { Platform, StyleSheet } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";
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
}: Props) {
	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={index}
			onChange={onChange}
			onAnimate={onAnimate}
			snapPoints={snapPoints}
			enablePanDownToClose
			enableOverDrag={false}
			enableContentPanningGesture={false}
			keyboardBehavior={Platform.OS === "ios" ? "interactive" : "extend"}
			keyboardBlurBehavior="none"
			backgroundStyle={{ backgroundColor: palette.textPrimary_1 }}
		>
			<BottomSheetView style={styles.sheetContent}>
				<BottomSheetPreviewSimple
					name={name}
					isOpen={isOpen}
					distanceText={distanceText}
					todayHoursLabel={todayHoursLabel}
					onPressDetails={onPressDetails}
				/>
			</BottomSheetView>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	sheetContent: {
		backgroundColor: palette.textPrimary_1,
		paddingBottom: 12,
		minHeight: 200,
	},
});

