import { NavigationContainer, DefaultTheme, LinkingOptions, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";

import { selectAuthStatus } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import {
    ProfileStackParamList,
    RootStackParamList,
    RootTabsParamList,
} from "@/app/adapters/primary/react/navigation/types";
import { HomeScreen } from "@/app/adapters/primary/react/features/home/screens/HomeScreen";
import { MapScreen } from "@/app/adapters/primary/react/features/map/screens/MapScreen";
import { RewardsScreen } from "@/app/adapters/primary/react/features/rewards/screens/RewardsScreen";
import { ProfileScreen } from "@/app/adapters/primary/react/features/profile/screens/ProfileScreen";
import { CafeDetailsScreen } from "@/app/adapters/primary/react/features/cafes/screens/CafeDetailsScreen";
import { ArticleScreen } from "@/app/adapters/primary/react/features/articles/screens/ArticleScreen";
import { ScanTicketScreen } from "@/app/adapters/primary/react/features/scan/screens/ScanTicketScreen";
import { LoginScreen } from "@/app/adapters/primary/react/features/auth/screens/LoginScreen";
import { SearchScreen } from "@/app/adapters/primary/react/features/search/screens/SearchScreen";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { EditProfileScreen } from "@/app/adapters/primary/react/features/profile/screens/EditProfileScreen";
import { TicketsScreen } from "@/app/adapters/primary/react/features/profile/screens/TicketsScreen";
import { FavoritesScreen } from "@/app/adapters/primary/react/features/profile/screens/FavoritesScreen";
import { AppSettingsScreen } from "@/app/adapters/primary/react/features/profile/screens/AppSettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RootTabsParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ["fragments://"],
    config: {
        screens: {
            CafeDetails: "coffee/:id",
            Article: "article/:slug",
            Login: "login",
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

function ProfileNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
            <ProfileStack.Screen name="Tickets" component={TicketsScreen} />
            <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
            <ProfileStack.Screen name="AppSettings" component={AppSettingsScreen} />
        </ProfileStack.Navigator>
    );
}

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
            <Tabs.Screen name="Rewards" component={RewardsScreen} options={{ title: "Pass" }} />
            <Tabs.Screen name="Profile" component={ProfileNavigator} options={{ title: "Profil" }} />
        </Tabs.Navigator>
    );
}

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
                name="ScanTicketModal"
                component={ScanTicketScreen}
                options={{ presentation: "modal", title: "Scanner un ticket" }}
            />
            <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

function SignedOutNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

export function RootNavigator() {
    const status = useSelector(selectAuthStatus);

    const content = useMemo(() => {
        if (status === "loading") {
            return null;
        }
        if (status === "signedIn") {
            return <SignedInNavigator />;
        }
        return <SignedOutNavigator />;
    }, [status]);

    return (
        <NavigationIndependentTree>
            <NavigationContainer linking={linking} theme={theme}>
                {content}
            </NavigationContainer>
        </NavigationIndependentTree>
    );
}
