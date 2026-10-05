import {StyleSheet, View} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";
import CoffeeList from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeList";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/native";
import {RootStackNavigationProp} from "@/app/adapters/primary/react/navigation/types";
import { useCoffeeDiscovery } from "@/app/adapters/secondary/viewModel/useCoffeeDiscovery";
import { CoffeeDiscoveryControls } from "@/app/adapters/primary/react/features/map/components/CoffeeDiscoveryControls";

import { CoffeeListHeader } from "../components/CoffeeListHeader";

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
            <CoffeeList
                coffeeIds={discovery.coffees.map((coffee) => String(coffee.id))}
                onSelectCoffee={(id) => openCafeDetails(String(id))}
                header={<View style={styles.header}>
                    <CoffeeListHeader onMap={toggleViewMode} />
                    <CoffeeDiscoveryControls discovery={discovery} />
                </View>}
            />
        </View>
    )
}

export default ListViewForCoffees;

const styles = StyleSheet.create({
    listWrapper: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: palette.background,
    },
    header: { gap: 16, marginBottom: 8 },
});
