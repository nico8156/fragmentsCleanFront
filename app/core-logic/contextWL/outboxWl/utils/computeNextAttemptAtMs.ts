export const computeNextAttemptAtMs = ({
	attemptsSoFar,
	nowMs,
	random = Math.random,
	baseMs = 1000,
	capMs = 60_000,
	jitterMs = 300,
}: {
	attemptsSoFar: number;
	nowMs: number;
	random?: () => number;
	baseMs?: number;
	capMs?: number;
	jitterMs?: number;
}) => {
	const exp = Math.min(Math.max(attemptsSoFar, 0), 6);
	const backoff = Math.min(capMs, (2 ** exp) * baseMs);
	const jitter = Math.floor(random() * jitterMs);
	return nowMs + backoff + jitter;
};
