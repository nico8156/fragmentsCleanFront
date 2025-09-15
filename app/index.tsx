// app/index.tsx
import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import {AppState} from "@/app/store/appState";

export default function Index() {
    const status = useSelector((s: AppState) => s.authState.status);
    const isAuth = status === "authenticated";

    return <Redirect href={isAuth ? "/(tabs)/home" : "/(auth)/login"}/>;
}
