import { NavigatorScreenParams } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootTabsParamList = {
    Home: undefined;
    Map: undefined;
    Rewards: undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    Tabs: NavigatorScreenParams<RootTabsParamList>;
    CafeDetails: { id: string };
    Article: { slug: string };
    ScanTicketModal: undefined;
    Login: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
