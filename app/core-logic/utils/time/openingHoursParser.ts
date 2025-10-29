// Lundi=0 ... Dimanche=6
const DAY_FR_TO_IDX: Record<string, number> = {
    'lundi':0, 'mardi':1, 'mercredi':2, 'jeudi':3,
    'vendredi':4, 'samedi':5, 'dimanche':6
};

// remplace espaces spéciales (fine, insécable…) par un espace simple
const normalizeSpaces = (s: string) => s.replace(/[\u00A0\u2009\u202F]/g, ' ').trim();

type DayWindow = { day: 0|1|2|3|4|5|6; start: number; end: number }; // minutes depuis minuit

/**
 * Exemples supportés :
 * "jeudi: 08:00 – 18:30"
 * "jeudi: 08:00-12:00, 14:00-18:30"
 * "jeudi: Fermé"
 */
export function parseWeekdayDescription(line: string): { day: number, ranges: DayWindow[] } | null {
    if (!line) return null;

    const clean = normalizeSpaces(line);
    // capture <jour> : <contenu>
    const m = clean.match(/^([a-zéèêàùîôç]+)\s*:?\s*(.+)$/i);
    if (!m) return null;

    const dayName = m[1].toLowerCase();
    const rest = m[2];
    const day = DAY_FR_TO_IDX[dayName];
    if (day == null) return null;

    if (/ferm[ée]?/i.test(rest)) {
        return { day, ranges: [] };
    }

    // sépare par virgule si plusieurs créneaux
    const chunks = rest.split(',').map(s => s.trim()).filter(Boolean);

    const ranges: DayWindow[] = [];
    for (const chunk of chunks) {
        // support "08:00-12:00" ou "08:00 – 12:00" (tiret / en-dash)
        const rm = chunk.match(/(\d{1,2})\s*:\s*(\d{2})\s*[-–]\s*(\d{1,2})\s*:\s*(\d{2})/);
        if (!rm) continue;
        const h1 = Number(rm[1]), m1 = Number(rm[2]);
        const h2 = Number(rm[3]), m2 = Number(rm[4]);
        const start = h1 * 60 + m1;
        const end   = h2 * 60 + m2;
        ranges.push({ day: day as DayWindow['day'], start, end });
    }

    return { day, ranges };
}
