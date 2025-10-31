import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { CafeFullVM } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { useDistanceToPoint } from "@/app/adapters/secondary/viewModel/useDistanceToPoint";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { palette } from "@/constants/colors";

type Props = {
    id: CoffeeId;
    onPress?: (id: CoffeeId) => void;
}

const CoffeeListItem = ({id, onPress}: Props) => {

    const {coffee}:{coffee:CafeFullVM|undefined} = useCafeFull(id)
    const isOpen = useCafeOpenNow(id)
    const distance = useDistanceToPoint(coffee ? {lat: coffee.location.lat, lng: coffee.location.lon} : undefined)
    const navigation = useNavigation<RootStackNavigationProp>();

    if(!coffee) return null

    const handlePress = () => {
        if(onPress) {
            onPress(id)
            return
        }
        navigation.navigate("CafeDetails", { id: coffee.id.toString() })
    }

    const openColor = isOpen ? palette.success : palette.danger

    return (
        <Pressable style={styles.card} onPress={handlePress}>
            <Image
                source={coffee.photos[0]}
                style={styles.cover}
                contentFit={'cover'}
            />
            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>{coffee.name}</Text>
                {coffee.address.line1 ? (
                    <Text style={styles.address} numberOfLines={1}>{coffee.address.line1}</Text>
                ) : null}
                {coffee.address.city ? (
                    <Text style={styles.addressSecondary}>{coffee.address.city}</Text>
                ) : null}
                <View style={styles.metaRow}>
                    <View style={[styles.badge, {backgroundColor: isOpen ? 'rgba(79,178,142,0.18)' : 'rgba(224,92,75,0.18)'}]}>
                        <SymbolView name={isOpen ? 'sun.max.fill' : 'moon.zzz'} size={14} tintColor={openColor} />
                        <Text style={[styles.badgeText, {color: openColor}]}>{isOpen ? 'Ouvert' : 'Fermé'}</Text>
                    </View>
                    {distance.text ? (
                        <Text style={styles.distance}>{distance.text}</Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
    )
}

export default CoffeeListItem;

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: palette.elevated,
        borderRadius: 22,
        overflow: 'hidden',
        padding: 14,
        gap: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 10},
        elevation: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    cover: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: palette.overlay,
    },
    details: {
        flex: 1,
        gap: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    address: {
        fontSize: 13,
        color: palette.textSecondary,
    },
    addressSecondary: {
        fontSize: 12,
        color: palette.textMuted,
    },
    metaRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    distance: {
        fontSize: 12,
        color: palette.textMuted,
    },
})
