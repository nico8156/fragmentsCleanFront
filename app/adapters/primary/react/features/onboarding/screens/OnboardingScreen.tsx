import React from "react";
import { View, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import {markHasCompletedOnboarding} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import Onboarding from "@/app/adapters/primary/react/features/onboarding/components/Onboarding";


export function OnboardingScreen() {
    const dispatch = useDispatch();

    const handleFinish = () => {
        dispatch(markHasCompletedOnboarding());
    };

    return (
        <View style={styles.container}>
            <Onboarding onFinish={handleFinish} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
