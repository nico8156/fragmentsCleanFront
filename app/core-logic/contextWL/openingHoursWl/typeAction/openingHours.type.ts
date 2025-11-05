

export interface ohStateWl {
    byCoffeeIdDayWindow: Record<string, DayWindow[]>
    byCoffeeId: Record<string, string[]>
    statusByCoffeeId: Record<string, 'idle'|'loading'|'ok'|'error'>;
}

export type DayWindow = { day: 0|1|2|3|4|5|6; start: number; end: number }; // minutes depuis minuit

export type OpeningHours = {
    id: string,
    coffee_id: string,
    weekday_description: string,
}
export type interval = [number, number]

export type HoursByDayVM = Record<0|1|2|3|4|5|6, {
    intervals: interval[]; // [[start,end], ...] en minutes
    label: string;                      // "08:00–12:00, 14:00–18:30" ou "Fermé"
    isClosed: boolean;
}>