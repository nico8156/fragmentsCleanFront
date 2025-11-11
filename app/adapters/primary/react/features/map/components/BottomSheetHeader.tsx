import {Pressable, StyleSheet, Text, View} from "react-native";
import {SymbolView} from "expo-symbols";

import SvgComponent from "@/app/adapters/primary/react/features/map/components/SvgComponent";
import {palette} from "@/app/adapters/primary/react/css/colors";
import {useCommentsForCafe} from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import {useLikesForCafe} from "@/app/adapters/secondary/viewModel/useLikesForCafe";
import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

type Props = {
    name: string | undefined;
    coffeeId: CoffeeId | undefined;
};

const BottomSheetHeader = ({ name, coffeeId }: Props) => {
    const { comments } = useCommentsForCafe(coffeeId);
    const {
        count: likeCount,
        likedByMe,
        toggleLike,
        isRefreshing,
        isLoading,
    } = useLikesForCafe(coffeeId);
    const isBusy = isLoading || isRefreshing;

    return (
        <View style={styles.container}>
            <View style={styles.border}>
                <SvgComponent />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <View style={styles.socialsContainer}>
                    <Pressable style={styles.socialContainer} disabled={!coffeeId} onPress={toggleLike}>
                        <SymbolView
                            name={likedByMe ? "heart.fill" : "heart"}
                            size={25}
                            tintColor={likedByMe ? palette.accent : "lightgray"}
                        />
                        <Text style={styles.legend}>{isBusy ? "…" : likeCount}</Text>
                    </Pressable>
                    <View style={styles.socialContainer}>
                        <SymbolView name="bubble.fill" size={25} tintColor="lightgray" />
                        <Text style={styles.legend}>{comments.length}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default BottomSheetHeader;

const styles = StyleSheet.create({
    container: {
        backgroundColor: palette.textPrimary_1,
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    border: {
        borderWidth: 1,
        borderColor: palette.success_30,
    },
    info: {
        marginLeft: 5,
    },
    socialsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    socialContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        color: palette.textPrimary_30,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
    },
    legend: palette.font14,
});
