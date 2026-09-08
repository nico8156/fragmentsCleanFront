import { FlatList, StyleSheet, Text, View } from "react-native";
import { CoffeeId, parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeListItem from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeListItem";
import { palette } from "@/app/adapters/primary/react/css/colors";

type Props = {
    onSelectCoffee?: (id: CoffeeId) => void;
    coffeeIds: string[];
}

const CoffeeList = ({onSelectCoffee, coffeeIds}: Props) => {

    return (
        <FlatList
            data={coffeeIds}
            keyExtractor={(id) => id}
            renderItem={({item}) => (
                <CoffeeListItem id={parseToCoffeeId(item)} onPress={onSelectCoffee}/>
            )}
            contentContainerStyle={coffeeIds.length === 0 ? styles.emptyContent : styles.listContent}
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

        gap: 16,
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
        color: palette.textPrimary,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        color: palette.textMuted,
        lineHeight: 20,
    },
})
