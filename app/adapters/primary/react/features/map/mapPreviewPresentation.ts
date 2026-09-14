export const MAP_PREVIEW_SNAP_POINTS = ["58%"] as const;

type CloseableSheetRef = {
	readonly current: { close: () => void } | null;
};

export function closeCoffeePreviewSheet(
	sheetRef: CloseableSheetRef,
	setBottomSheetIndex: (index: number) => void,
) {
	sheetRef.current?.close();
	setBottomSheetIndex(-1);
}
