import {DayWindow} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export function isOpenNowFromWindows(windows: DayWindow[], now = new Date()): boolean {
    const dayIdx = ((now.getDay() + 6) % 7) as DayWindow['day'];
    const minutes = now.getHours()*60 + now.getMinutes();
    // ... comme déjà vu
    return windows.some(w =>
        w.day === dayIdx &&
        (w.end > w.start ? (minutes >= w.start && minutes < w.end)
            : (minutes >= w.start || minutes < w.end))
    );
}