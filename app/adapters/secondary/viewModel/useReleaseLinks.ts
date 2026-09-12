import Constants from "expo-constants";

// Non-secret runtime presentation configuration; no network or business writes.
export const useReleaseLinks = () => {
	const extra = Constants.expoConfig?.extra;
	return {
		privacyPolicyUrl: typeof extra?.privacyPolicyUrl === "string" ? extra.privacyPolicyUrl : undefined,
		termsUrl: typeof extra?.termsUrl === "string" ? extra.termsUrl : undefined,
	};
};
