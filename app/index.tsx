import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "@/app/contextWL/userWl/selector/user.selector";

export default function Index() {

    const status = useSelector(selectAuthStatus);

    if (status === "loading") {
        return null;
    }

    if (status === "signedIn") {
        return <Redirect href="/(tabs)/explore" />;
    }

    if (status === "error") {
        return <Redirect href="/(auth)/login" />;
    }

    return <Redirect href="/(auth)/login" />;
}
