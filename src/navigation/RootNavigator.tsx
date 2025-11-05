import {NavigationContainer, DefaultTheme, LinkingOptions, NavigationIndependentTree} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { selectAuthStatus } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import { RootStackParamList, RootTabsParamList } from "@/src/navigation/types";
import { HomeScreen } from "@/src/features/home/screens/HomeScreen";
import {MapScreen} from "@/src/features/map/screens/MapScreen";
import { RewardsScreen } from "@/src/features/rewards/screens/RewardsScreen";
import { ProfileScreen } from "@/src/features/profile/screens/ProfileScreen";
import { CafeDetailsScreen } from "@/src/features/cafes/screens/CafeDetailsScreen";
import { ArticleScreen } from "@/src/features/articles/screens/ArticleScreen";
import { ScanTicketScreen } from "@/src/features/scan/screens/ScanTicketScreen";
import { LoginScreen } from "@/src/features/auth/screens/LoginScreen";
import { SearchScreen } from "@/src/features/search/screens/SearchScreen";
import { palette } from "@/app/adapters/primary/react/css/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<RootTabsParamList>();

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
                    Profile: "profile",
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

function TabsNavigator() {
    return (
        <Tabs.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: palette.accent,
                tabBarInactiveTintColor: palette.textMuted,
                tabBarLabelStyle: {
                    fontWeight: "600",
                    fontSize: 12,
                },
                tabBarStyle: {
                    backgroundColor: palette.surface,
                    borderTopColor: palette.border,
                    paddingTop: 8,
                    paddingBottom: 10,
                    height: 70,
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
            <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
        </Tabs.Navigator>
    );
}

function SignedInNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: palette.background },
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
