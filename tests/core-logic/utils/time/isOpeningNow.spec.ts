import { isOpenNowFromWindows } from "@/app/core-logic/utils/time/isOpeningNow";

describe("isOpenNowFromWindows", () => {
    const monday = new Date(2026, 8, 7, 10, 30);

    it("returns undefined until the opening-hours snapshot is available", () => {
        expect(isOpenNowFromWindows(undefined, monday)).toBeUndefined();
    });

    it("detects a regular opening interval", () => {
        expect(isOpenNowFromWindows([{ day: 0, start: 9 * 60, end: 18 * 60 }], monday)).toBe(true);
        expect(isOpenNowFromWindows([{ day: 0, start: 11 * 60, end: 18 * 60 }], monday)).toBe(false);
    });

    it("carries an overnight interval into the next day", () => {
        const tuesdayAtOne = new Date(2026, 8, 8, 1, 0);
        expect(isOpenNowFromWindows([{ day: 0, start: 22 * 60, end: 2 * 60 }], tuesdayAtOne)).toBe(true);
        expect(isOpenNowFromWindows([{ day: 1, start: 22 * 60, end: 2 * 60 }], tuesdayAtOne)).toBe(false);
    });

    it("treats an empty loaded schedule as closed", () => {
        expect(isOpenNowFromWindows([], monday)).toBe(false);
    });
});
