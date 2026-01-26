const isDev = __DEV__ === true;

type LogLevel = "debug" | "info" | "warn" | "error";

type Logger = {
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
};

const redactor = (args: any[]) =>
	args.map(a => {
		if (typeof a === "string") {
			// exemple simple, extensible
			return a.replace(/Bearer\s+[A-Za-z0-9\-_\.]+/g, "Bearer [REDACTED]");
		}
		return a;
	});

export const logger: Logger = {
	debug: (...args) => {
		if (isDev) console.debug("[DEBUG]", ...redactor(args));
	},
	info: (...args) => {
		if (isDev) console.info("[INFO]", ...redactor(args));
	},
	warn: (...args) => {
		console.warn("[WARN]", ...redactor(args));
	},
	error: (...args) => {
		console.error("[ERROR]", ...redactor(args));
	},
};

