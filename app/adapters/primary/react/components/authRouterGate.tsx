import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

const AUTH_GROUP = "(auth)";

export const AuthRouterGate = () => {
    const status = useSelector(selectAuthStatus);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        const inAuthGroup = segments[0] === AUTH_GROUP;
        if (status === "signedOut" && !inAuthGroup) {
            router.replace("/(auth)/login");
        }
        if (status === "signedIn" && inAuthGroup) {
            router.replace("/(tabs)/explore");
        }
    }, [status, segments, router]);

    return null;
};
