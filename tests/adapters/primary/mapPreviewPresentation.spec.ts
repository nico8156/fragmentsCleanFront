import { closeCoffeePreviewSheet, MAP_PREVIEW_SNAP_POINTS } from "@/app/adapters/primary/react/features/map/mapPreviewPresentation";
import { FLOATING_TAB_BAR_CLEARANCE } from "@/app/adapters/primary/react/navigation/floatingTabBar";

describe("map coffee preview presentation", () => {
	it("opens high enough and reserves the floating tab bar clearance", () => {
		expect(MAP_PREVIEW_SNAP_POINTS).toEqual(["58%"]);
		expect(FLOATING_TAB_BAR_CLEARANCE).toBeGreaterThanOrEqual(100);
	});

	it("closes both the native sheet and its React state", () => {
		const close = jest.fn();
		const setIndex = jest.fn();
		closeCoffeePreviewSheet({ current: { close } }, setIndex);
		expect(close).toHaveBeenCalledTimes(1);
		expect(setIndex).toHaveBeenCalledWith(-1);
	});
});
