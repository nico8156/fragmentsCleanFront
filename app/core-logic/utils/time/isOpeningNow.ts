import {DayWindow} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export function isOpenNowFromWindows(windows: DayWindow[] | undefined, now = new Date()): boolean | undefined {
    if (windows === undefined) return undefined;
    const dayIdx = ((now.getDay() + 6) % 7) as DayWindow['day'];
    const previousDayIdx = ((dayIdx + 6) % 7) as DayWindow['day'];
    const minutes = now.getHours()*60 + now.getMinutes();
    return windows.some(window => {
        if (window.end > window.start) {
            return window.day === dayIdx && minutes >= window.start && minutes < window.end;
        }
        return (window.day === dayIdx && minutes >= window.start)
            || (window.day === previousDayIdx && minutes < window.end);
    });
}
