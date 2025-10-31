import {FlatList, StyleSheet, Text, View} from "react-native";
import {useSelector} from "react-redux";
import {AppStateWl} from "@/app/store/appStateWl";
import {CoffeeId, parseToCoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeListItem from "@/app/adapters/primary/react/components/coffeeSelection/coffeeListItem";

type Props = {
    onSelectCoffee?: (id: CoffeeId) => void;
}

const CoffeeList = ({onSelectCoffee}: Props) => {

    const ids = useSelector((s:any)=>s.cfState.ids) as AppStateWl["coffees"]["ids"]

    return (
        <FlatList
            data={ids}
            keyExtractor={(id) => id}
            renderItem={({item}) => (
                <CoffeeListItem id={parseToCoffeeId(item)} onPress={onSelectCoffee}/>
            )}
            contentContainerStyle={ids.length === 0 ? styles.emptyContent : styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Aucun café trouvé</Text>
                    <Text style={styles.emptySubtitle}>Change de quartier ou actualise ta position.</Text>
                </View>
            }
        />
    )
}

export default CoffeeList;

const styles = StyleSheet.create({
    listContent: {
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    emptyContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyState: {
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: '#6E6E73',
        lineHeight: 20,
    },
})
