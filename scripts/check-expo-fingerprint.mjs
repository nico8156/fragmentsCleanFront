import { createProjectHashAsync } from "@expo/fingerprint";

const hash = await createProjectHashAsync(process.cwd(), { platforms: ["ios"] });

if (!/^[a-f0-9]{40}$/.test(hash)) {
	throw new Error(`Expo produced an invalid project fingerprint: ${hash}`);
}

console.log(`Expo iOS project fingerprint: ${hash}`);
