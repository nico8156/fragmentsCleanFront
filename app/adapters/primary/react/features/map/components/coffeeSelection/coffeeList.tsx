import { FlatList, StyleSheet } from "react-native";
import type { ReactElement } from "react";
import { CoffeeId, parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeListItem from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeListItem";
import { ContentState } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing, scrollContentSpacing } from "@/app/adapters/primary/react/css/designTokens";
import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";

type Props = {
    onSelectCoffee?: (id: CoffeeId) => void;
    coffeeIds: string[];
    header?: ReactElement;
}

const CoffeeList = ({onSelectCoffee, coffeeIds, header}: Props) => {

    return (
        <ScrollClearance>{bottom => (
            <FlatList
                data={coffeeIds}
                ListHeaderComponent={header}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                keyExtractor={(id) => id}
                renderItem={({item}) => (
                    <CoffeeListItem id={parseToCoffeeId(item)} onPress={onSelectCoffee}/>
                )}
                contentContainerStyle={[coffeeIds.length === 0 ? styles.emptyContent : styles.listContent, scrollContentSpacing, { paddingBottom: scrollContentSpacing.paddingBottom + bottom }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <ContentState kind="empty" title="Aucun café trouvé" message="Essaie une autre recherche ou ajuste les filtres." />
                }
            />
        )}</ScrollClearance>
    )
}

export default CoffeeList;

const styles = StyleSheet.create({
    listContent: {
        paddingTop: spacing.compact,

        gap: spacing.micro,
    },
    emptyContent: {
        flexGrow: 1,
        gap: spacing.section,
    },
});
