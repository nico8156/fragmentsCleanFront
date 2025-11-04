import {Pressable, StyleSheet, Text, View} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/constants/colors";
import CoffeeList from "@/app/adapters/primary/react/components/coffeeSelection/coffeeList";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useState} from "react";
import {useNavigation} from "@react-navigation/native";
import {RootStackNavigationProp} from "@/src/navigation/types";

const ListViewForCoffees = () => {

    const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const toggleViewMode = () => {
        setViewMode((mode) => {
            if (mode === 'map') {
                setSelectedCoffeeId(null);
                return 'list';
            }
            return 'map';
        });
    };

    const openCafeDetails = (id: string) => {
        navigation.navigate("CafeDetails", { id });
    };

    return(
        <View style={[styles.listWrapper, { paddingTop: insets.top + 16 }]}>
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Tous les cafés</Text>
                <Pressable onPress={toggleViewMode} style={styles.overlayToggle} accessibilityRole="button">
                    <SymbolView name={'map.fill'} size={22} tintColor={palette.textPrimary} />
                </Pressable>
            </View>
            <CoffeeList onSelectCoffee={(id) => openCafeDetails(String(id))} />
        </View>
    )
}

export default ListViewForCoffees;

const styles = StyleSheet.create({
    listWrapper: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 20,
        backgroundColor: palette.background,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    overlayToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(33, 24, 19, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.06)',
    },
})