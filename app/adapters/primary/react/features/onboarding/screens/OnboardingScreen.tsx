import React from "react";
import { View, StyleSheet } from "react-native";
import Onboarding from "@/app/adapters/primary/react/features/onboarding/components/Onboarding";
import {useOnBoarding} from "@/app/adapters/secondary/viewModel/useOnBoarding";


export function OnboardingScreen() {
    const {markOnBoardingAsCompleted} = useOnBoarding()

    const handleFinish = () => {
        markOnBoardingAsCompleted()
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
