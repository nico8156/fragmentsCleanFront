import {Pressable, StyleSheet, Text, View} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";
import CoffeeList from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeList";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/native";
import {RootStackNavigationProp} from "@/app/adapters/primary/react/navigation/types";
import { useCoffeeDiscovery } from "@/app/adapters/secondary/viewModel/useCoffeeDiscovery";
import { CoffeeDiscoveryControls } from "@/app/adapters/primary/react/features/map/components/CoffeeDiscoveryControls";

type Props = {
    toggleViewMode: () => void;
}

const ListViewForCoffees = (props:Props) => {

const {toggleViewMode} = props;

    const navigation = useNavigation<RootStackNavigationProp>();
    const insets = useSafeAreaInsets();
    const discovery = useCoffeeDiscovery();

    const openCafeDetails = (id: string) => {
        navigation.navigate("CafeDetails", { id });
    };

    return(
        <View style={[styles.listWrapper, { paddingTop: insets.top + 16 }]}>
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{discovery.hasLocation ? "Cafés autour de moi" : "Découvrir les cafés"}</Text>
                <Pressable onPress={toggleViewMode} style={styles.overlayToggle} accessibilityRole="button">
                    <SymbolView name={'map.fill'} size={22} tintColor={palette.textPrimary} />
                </Pressable>
            </View>
            <CoffeeDiscoveryControls discovery={discovery} />
            <CoffeeList coffeeIds={discovery.coffees.map((coffee) => String(coffee.id))} onSelectCoffee={(id) => openCafeDetails(String(id))} />
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
        color: palette.primary_90,
    },
    overlayToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(33, 24, 19, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth:1,
        borderColor:palette.secondary_90,
    },
})
