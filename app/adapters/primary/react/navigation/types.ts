import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
    Rewards: undefined;
    Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
    Onboarding: undefined;
    Tabs: NavigatorScreenParams<RootTabsParamList>;
    CafeDetails: { id: string };
    Article: { slug: string };
    ScanTicketModal: undefined;
    Search: undefined;
    Login: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type ProfileStackNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
