export const computeBackoffMs = (attempt: number, base = 1000, cap = 60000) => {
    const exp = Math.min(cap, base * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * Math.min(5000, exp / 2));
    return Math.min(cap, exp + jitter);
};

export const isNetworkOr5xx = (e: unknown) => {
    const msg = String(e);
    return /Network|timeout|5\d\d/.test(msg);
};