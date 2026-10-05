import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";
import { PassContent } from "../components/PassContent";

export function PassScreen() {
    const vm = usePassRingsViewModel();
    return (
        <SafeAreaView edges={["top", "left", "right"]} style={styles.root}>
            <ScrollClearance>{bottom => (
                <ScrollView contentContainerStyle={{ paddingBottom: bottom }}><PassContent vm={vm} /></ScrollView>
            )}</ScrollClearance>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: palette.background } });
export default PassScreen;
