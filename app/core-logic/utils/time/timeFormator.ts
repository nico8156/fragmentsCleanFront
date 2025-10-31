import {DayWindow, HoursByDayVM} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

const toHHmm = (m: number) => {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
};

const DAY_LABELS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'] as const;

export function toHoursByDayVM(windows: DayWindow[]): HoursByDayVM {
    const byDay = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]} as Record<DayWindow['day'], DayWindow[]>;
    for (const w of windows) byDay[w.day].push(w);
    (Object.keys(byDay) as unknown as DayWindow['day'][]).forEach(d =>
        byDay[d].sort((a,b)=>a.start-b.start)
    );

    const vm = {} as HoursByDayVM;
    (Object.keys(byDay) as unknown as DayWindow['day'][]).forEach(d => {
        const arr = byDay[d];
        const intervals = arr.map(w => [w.start, w.end] as [number, number]);
        const isClosed = intervals.length === 0;
        const label = isClosed
            ? 'Fermé'
            : intervals.map(([s,e]) => `${toHHmm(s)}–${toHHmm(e)}`).join(', ');
        vm[d] = { intervals, label, isClosed };
    });
    return vm;
}
