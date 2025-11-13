import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { SFSymbols6_0 } from "sf-symbols-typescript";

import { palette } from "@/app/adapters/primary/react/css/colors";

export interface ProfileMenuItem<TDestination extends string = string> {
    symbolName: SFSymbols6_0;
    title: string;
    destination: TDestination;
}

interface ProfileMenuListProps<TDestination extends string> {
    items: ProfileMenuItem<TDestination>[];
    onNavigate: (destination: TDestination) => void;
}

export function ProfileMenuList<TDestination extends string>({
    items,
    onNavigate,
}: ProfileMenuListProps<TDestination>) {
    return (
        <View style={styles.wrapper}>
            {items.map((item) => (
                <Pressable key={item.destination} onPress={() => onNavigate(item.destination)}>
                    <View style={[styles.row, {justifyContent:"space-between"}]}>
                        <View style={{flexDirection:'row', gap:16}}>
                            <SymbolView name={item.symbolName} size={24} weight={"bold"} tintColor={palette.textPrimary} />
                            <Text style={styles.label}>{item.title}</Text>
                        </View>
                        <SymbolView name={"chevron.forward"} tintColor={palette.textPrimary}/>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: palette.bg_dark_30,
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    row: {
        backgroundColor: palette.bg_dark_10,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    label: {
        fontSize: 20,
        fontWeight: "500",
        color: palette.text_90,
    },
});
