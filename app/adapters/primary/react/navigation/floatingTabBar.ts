import type { RootTabsParamList } from "@/app/adapters/primary/react/navigation/types";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export const FLOATING_TAB_BAR_CLEARANCE = 116;

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
