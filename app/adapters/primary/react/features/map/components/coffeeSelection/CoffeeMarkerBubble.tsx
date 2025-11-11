import { View, StyleSheet, Text } from "react-native";
import { SymbolView } from "expo-symbols";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useLikesForCafe } from "@/app/adapters/secondary/viewModel/useLikesForCafe";
import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

type Props = {
    isOpen: boolean;
    showExpanded: boolean;
    selected?: boolean;
    coffeeId: CoffeeId;
};

export const CoffeeMarkerBubble = ({ isOpen, showExpanded, selected, coffeeId }: Props) => {
    const { count, likedByMe, isRefreshing, isLoading } = useLikesForCafe(coffeeId);
    const isBusy = isLoading || isRefreshing;

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.markerBody,
                    selected && styles.markerBodySelected,
                    showExpanded && styles.markerBodyExpanded,
                ]}
            >
                <View style={styles.iconWrapper}>
                    <SymbolView
                        name={isOpen ? "cup.and.saucer.fill" : "cup.and.saucer"}
                        size={20}
                        tintColor="#F4EDE6"
                    />
                </View>

                {showExpanded && (
                    <View style={styles.likes}>
                        <Text style={styles.likesText}>{isBusy ? "…" : count}</Text>
                        <SymbolView
                            name={likedByMe ? "heart.fill" : "heart"}
                            size={18}
                            tintColor={likedByMe ? palette.accent : palette.textPrimary}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { alignItems: "center" },
    markerBody: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 3,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "rgba(28, 21, 17, 0.92)",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    markerBodyExpanded: {},
    markerBodySelected: {
        backgroundColor: palette.accentMuted,
        borderColor: palette.accent,
    },
    iconWrapper: {
        backgroundColor: palette.success,
        padding: 4,
        borderRadius: 999,
    },
    likes: { flexDirection: "row", gap: 8, marginLeft: 8 },
    likesText: { fontSize: 16, fontWeight: "600", color: palette.textPrimary },
});
