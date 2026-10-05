import { tabBarClearance } from "@/app/adapters/primary/react/css/designTokens";
import type { RootTabsParamList } from "@/app/adapters/primary/react/navigation/types";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

// Legacy default for screens migrated separately; new root surfaces use their safe-area inset.
export const FLOATING_TAB_BAR_CLEARANCE = tabBarClearance(24);

export const floatingTabGlassPresentation = {
	blurIntensity: 68,
	surfaceColor: "rgba(21,16,14,0.32)",
	borderColor: "rgba(244,237,230,0.28)",
	highlightColor: "rgba(255,255,255,0.34)",
} as const;

export type FloatingTabPresentation = {
	label: string;
	icon: ComponentProps<typeof Ionicons>["name"];
};

export const floatingTabPresentation: Record<keyof RootTabsParamList, FloatingTabPresentation> = {
	Home: { label: "Accueil", icon: "home" },
	Map: { label: "Carte", icon: "map" },
	Rewards: { label: "Pass", icon: "gift" },
	Profile: { label: "Profil", icon: "person" },
};
