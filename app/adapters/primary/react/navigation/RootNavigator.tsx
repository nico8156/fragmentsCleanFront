import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, LinkingOptions, NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import { palette } from "@/app/adapters/primary/react/css/colors";

import { ArticleScreen } from "@/app/adapters/primary/react/features/articles/screens/ArticleScreen";
import { LoginScreen } from "@/app/adapters/primary/react/features/auth/screens/LoginScreen";
import CafeDetailsScreen from "@/app/adapters/primary/react/features/cafes/screens/CafeDetailsScreen";
import { HomeScreen } from "@/app/adapters/primary/react/features/home/screens/HomeScreen";
import { MapScreen } from "@/app/adapters/primary/react/features/map/screens/MapScreen";
import { OnboardingScreen } from "@/app/adapters/primary/react/features/onboarding/screens/OnboardingScreen";

import { AppSettingsScreen } from "@/app/adapters/primary/react/features/profile/screens/AppSettingsScreen";
import { EditProfileScreen } from "@/app/adapters/primary/react/features/profile/screens/EditProfileScreen";
import { FavoritesScreen } from "@/app/adapters/primary/react/features/profile/screens/FavoritesScreen";
import { ProfileScreen } from "@/app/adapters/primary/react/features/profile/screens/ProfileScreen";
import { TicketsScreen } from "@/app/adapters/primary/react/features/profile/screens/TicketsScreen";

import { PassScreen } from "@/app/adapters/primary/react/features/pass/screens/PassScreen";
import { BadgeDetailScreen } from "@/app/adapters/primary/react/features/pass/screens/BadgeDetailScreen";
import { AllBadgesScreen } from "@/app/adapters/primary/react/features/pass/screens/AllBadgesScreen";

import { ScanTicketScreen } from "@/app/adapters/primary/react/features/scan/screens/ScanTicketScreen";
import { SearchScreen } from "@/app/adapters/primary/react/features/search/screens/SearchScreen";

import {
	ProfileStackParamList,
	RootStackParamList,
	RootTabsParamList,
} from "@/app/adapters/primary/react/navigation/types";

import { useOnBoarding } from "@/app/adapters/secondary/viewModel/useOnBoarding";
import { selectAuthStatus } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

import { ActivityIndicator, View } from "react-native";

/* -------------------------------------------------------------------------- */
/*                             NAVIGATORS SETUP                               */
/* -------------------------------------------------------------------------- */

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RootTabsParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/* -------------------------------------------------------------------------- */
/*                                  LINKING                                   */
/* -------------------------------------------------------------------------- */

const linking: LinkingOptions<RootStackParamList> = {
	prefixes: ["fragments://"],
	config: {
		screens: {
			Onboarding: "onboarding",
			CafeDetails: "coffee/:id",
			Article: "article/:slug",
			Login: "login",

			BadgeDetail: "badge/:badgeId",
			AllBadges: "badges",

			Tabs: {
				screens: {
					Home: "home",
					Map: "map",
					Rewards: "rewards",
					Profile: {
						path: "profile",
						screens: {
							ProfileHome: "",
							EditProfile: "edit",
							Tickets: "tickets",
							Favorites: "favorites",
							AppSettings: "settings",
						},
					},
				},
			},
		},
	},
};

/* -------------------------------------------------------------------------- */
/*                                   THEME                                    */
/* -------------------------------------------------------------------------- */

const theme = {
	...DefaultTheme,
	dark: true,
	colors: {
		...DefaultTheme.colors,
		primary: palette.accent,
		background: palette.background,
		card: palette.surface,
		text: palette.textPrimary,
		border: palette.border,
		notification: palette.accent,
	},
};

/* -------------------------------------------------------------------------- */
/*                             PROFILE NAVIGATOR                              */
/* -------------------------------------------------------------------------- */

function ProfileNavigator() {
	return (
		<ProfileStack.Navigator
			screenOptions={{
				headerShown: true,
				headerTitleStyle: { color: palette.accent_1, fontWeight: "bold" },
				headerStyle: { backgroundColor: palette.primary_30 },
			}}
		>
			<ProfileStack.Screen
				name="ProfileHome"
				component={ProfileScreen}
				options={{ title: "Profil" }}
			/>
			<ProfileStack.Screen
				name="EditProfile"
				component={EditProfileScreen}
				options={{ title: "Modifier mon profil" }}
			/>
			<ProfileStack.Screen
				name="Tickets"
				component={TicketsScreen}
				options={{ title: "Mes tickets" }}
			/>
			<ProfileStack.Screen
				name="Favorites"
				component={FavoritesScreen}
				options={{ title: "Mes favoris" }}
			/>
			<ProfileStack.Screen
				name="AppSettings"
				component={AppSettingsScreen}
				options={{ title: "Paramètres" }}
			/>
		</ProfileStack.Navigator>
	);
}

/* -------------------------------------------------------------------------- */
/*                                TABS NAVIGATOR                              */
/* -------------------------------------------------------------------------- */

function TabsNavigator() {
	return (
		<Tabs.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarActiveTintColor: palette.primary_90,
				tabBarInactiveTintColor: palette.primary_50,
				tabBarLabelStyle: {
					fontWeight: "600",
					fontSize: 12,
				},
				tabBarStyle: {
					backgroundColor: palette.bg_light_90,
					borderTopColor: palette.bg_light_90,
					paddingTop: 5,
				},
				tabBarIcon: ({ color, size }) => {
					const iconMap: Record<keyof RootTabsParamList, keyof typeof Ionicons.glyphMap> = {
						Home: "home",
						Map: "map",
						Rewards: "gift",
						Profile: "person",
					};

					const iconName = iconMap[route.name] ?? "ellipse";
					return <Ionicons name={iconName} size={size} color={color} />;
				},
			})}
		>
			<Tabs.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
			<Tabs.Screen name="Map" component={MapScreen} options={{ title: "Carte" }} />

			{/* 🎯 ICI : remplacement RewardsScreen par PassScreen */}
			<Tabs.Screen name="Rewards" component={PassScreen} options={{ title: "Pass" }} />

			<Tabs.Screen name="Profile" component={ProfileNavigator} options={{ title: "Profil" }} />
		</Tabs.Navigator>
	);
}

/* -------------------------------------------------------------------------- */
/*                           SIGNED IN NAVIGATOR                              */
/* -------------------------------------------------------------------------- */

function SignedInNavigator() {
	return (
		<Stack.Navigator
			screenOptions={{
				contentStyle: { backgroundColor: palette.bg_light_90 },
			}}
		>
			<Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />

			<Stack.Screen
				name="CafeDetails"
				component={CafeDetailsScreen}
				options={{ headerShown: false }}
			/>

			<Stack.Screen
				name="Article"
				component={ArticleScreen}
				options={{ headerShown: false }}
			/>

			<Stack.Screen
				name="BadgeDetail"
				component={BadgeDetailScreen}
				options={{ title: "Badge" }}
			/>

			<Stack.Screen
				name="AllBadges"
				component={AllBadgesScreen}
				options={{ title: "Tous les badges" }}
			/>

			<Stack.Screen
				name="ScanTicketModal"
				component={ScanTicketScreen}
				options={{
					presentation: "modal",
					title: "Scanner un ticket",
					headerTitleStyle: { color: palette.accent_1, fontWeight: "bold" },
				}}
			/>

			<Stack.Screen
				name="Search"
				component={SearchScreen}
				options={{ headerShown: false }}
			/>
		</Stack.Navigator>
	);
}

/* -------------------------------------------------------------------------- */
/*                          SIGNED OUT / ONBOARDING                           */
/* -------------------------------------------------------------------------- */

function SignedOutNavigator() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
		</Stack.Navigator>
	);
}

const OnboardingStack = createNativeStackNavigator<RootStackParamList>();

function OnboardingNavigator() {
	return (
		<OnboardingStack.Navigator
			screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg_light_90 } }}
		>
			<OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
		</OnboardingStack.Navigator>
	);
}

/* -------------------------------------------------------------------------- */
/*                              ROOT NAVIGATOR                                */
/* -------------------------------------------------------------------------- */

export function RootNavigator() {
	const status = useSelector(selectAuthStatus);
	const { HasCompletedOnboarding } = useOnBoarding();

	const LoadingScreen = () => (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<ActivityIndicator />
		</View>
	);

	const content = useMemo(() => {
		if (status === "loading") return <LoadingScreen />;
		if (!HasCompletedOnboarding) return <OnboardingNavigator />;
		if (status === "signedIn") return <SignedInNavigator />;
		return <SignedOutNavigator />;
	}, [status, HasCompletedOnboarding]);

	return (
		<NavigationIndependentTree>
			<NavigationContainer linking={linking} theme={theme}>
				{content}
			</NavigationContainer>
		</NavigationIndependentTree>
	);
}
