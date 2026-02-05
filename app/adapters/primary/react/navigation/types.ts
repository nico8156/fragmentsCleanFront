import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type ProfileStackParamList = {
	ProfileHome: undefined;
	EditProfile: undefined;
	Tickets: undefined;
	Favorites: undefined;
	AppSettings: undefined;
};

export type RootTabsParamList = {
	Home: undefined;
	Map: undefined;

	// Tab name can stay "Rewards" even if UI label is "Pass"
	Rewards: undefined;

	Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
	Onboarding: undefined;
	Tabs: NavigatorScreenParams<RootTabsParamList>;

	CafeDetails: { id: string };
	Article: { slug: string };

	// Existing
	ScanTicketModal: undefined;
	Search: undefined;
	Login: undefined;

	// ✅ NEW (Pass flow)
	BadgeDetail: { badgeId: string };
	AllBadges: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type ProfileStackNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
