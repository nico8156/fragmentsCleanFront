import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import {
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { BottomSheet, Host } from "@expo/ui/swift-ui";
import { palette } from "@/app/adapters/primary/react/css/colors";

interface Props {
    id: CoffeeId |null;
    isBottomSheetOpen: boolean;
    setIsBottomSheetOpen: (value: boolean) => void;
}

const CoffeeBottomSheet = (props: Props) => {
    const { isBottomSheetOpen, setIsBottomSheetOpen, id } = props;
    const { width } = useWindowDimensions();
    const { coffee } = useCafeFull(id);

    if (!id) return null;

    return (
        <Host
            style={[
                StyleSheet.absoluteFill,
                {
                    width,
                    // tu peux même enlever pointerEvents pour debug,
                    // puis remettre 'box-none' quand tout marche
                    pointerEvents: "none",
                },
            ]}
        >
            <BottomSheet
                isOpened={true}
                // on laisse le parent piloter l'ouverture.
                // Ici on ne gère QUE la fermeture au swipe.
                onIsOpenedChange={(opened: boolean) => {
                    if (!opened) {
                        setIsBottomSheetOpen(false);
                    }
                }}
                presentationDetents={["medium", "large"]}
                presentationDragIndicator="visible"
            >
                <ScrollView style={styles.sheetContent}>
                    <View style={{ height: 40, width: 40, backgroundColor: "black" }} />

                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: "white",
                            marginBottom: 8,
                        }}
                    >
                        {coffee?.name ?? "Café"}
                    </Text>

                    {coffee && (
                        <>
                            <Text style={{ color: "white", marginBottom: 8 }}>
                                {coffee.address?.city} {coffee.address?.postalCode}{" "}
                                {coffee.address?.city}
                            </Text>

                            {/* Tu peux rajouter ici : horaires, tags, rating, etc. */}
                        </>
                    )}
                </ScrollView>
            </BottomSheet>
        </Host>
    );
};

export default CoffeeBottomSheet;

const styles = StyleSheet.create({
    sheetContent: {
        backgroundColor: palette.textPrimary,
        flex: 1,
        padding: 16,
        rowGap: 8,
    },
});
