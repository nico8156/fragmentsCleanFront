// boot/deps.ts
export const now   = () => Date.now();
export const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const backoff = (attempts: number) =>
    Math.min(60000, 1000 * (2 ** attempts)) + Math.floor(Math.random() * 300);

