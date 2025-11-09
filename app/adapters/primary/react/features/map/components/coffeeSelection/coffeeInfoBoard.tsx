import {Callout} from "react-native-maps";
import {View, Text, StyleSheet, Pressable, GestureResponderEvent} from "react-native";
import {Image} from "expo-image";
import {CoffeeId, parseToCoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useCafeFull} from "@/app/adapters/secondary/viewModel/useCafeFull";
import {CafeFullVM} from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import {useDistanceToPoint} from "@/app/adapters/secondary/viewModel/useDistanceToPoint";
import {useCafeOpenNow} from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import {SymbolView} from "expo-symbols";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";

type Props = {
    coffeeId:CoffeeId;
    onRequestClose?: () => void;
}

const CoffeeInfoBoard = (props:Props) => {

    const coffeeId = parseToCoffeeId(props.coffeeId);
    const {coffee}:{coffee:CafeFullVM|undefined} = useCafeFull(coffeeId)
    const distance = useDistanceToPoint(coffee ? {lat:coffee.location.lat,lng:coffee.location.lon} : undefined)
    const isOpen = useCafeOpenNow(coffeeId)
    const navigation = useNavigation<RootStackNavigationProp>();

    if(!coffee) return null

    const handleNavigate = () => {
        navigation.navigate("CafeDetails", { id: coffee.id.toString() })
    }

    const handleClose = (event: GestureResponderEvent) => {
        event.stopPropagation()
        props.onRequestClose?.()
    }

    const openColor = isOpen ? '#34C759' : '#FF3B30'

    return (
        <Callout tooltip onPress={handleNavigate}>
            <View style={styles.tooltip}>
                <View style={styles.card}>
                    <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
                        <SymbolView name={'xmark.circle.fill'} size={20} tintColor={'rgba(60,60,67,0.6)'} />
                    </Pressable>
                    <Image
                        source={coffee.photos[0]}
                        style={styles.image}
                        contentFit={'cover'}
                    />
                    <View style={styles.content}>
                        <Text style={styles.name} numberOfLines={1}>{coffee.name}</Text>
                        {coffee.address.line1 ? (
                            <Text style={styles.address} numberOfLines={1}>{coffee.address.line1}</Text>
                        ) : null}
                        {coffee.address.city ? (
                            <Text style={styles.addressSecondary}>{coffee.address.city}</Text>
                        ) : null}
                        <View style={styles.metaRow}>
                            <View style={[styles.badge, {backgroundColor: isOpen ? 'rgba(52,199,89,0.16)' : 'rgba(255,59,48,0.16)'}]}>
                                <SymbolView name={isOpen ? 'sun.max.fill' : 'moon.zzz'} size={14} tintColor={openColor} />
                                <Text style={[styles.badgeText, {color: openColor}]}>{isOpen ? 'Ouvert' : 'Fermé'}</Text>
                            </View>
                            {distance.text ? (
                                <Text style={styles.distance}>{distance.text}</Text>
                            ) : null}
                        </View>
                    </View>
                </View>
                <View style={styles.arrow}/>
            </View>
        </Callout>
    )
}

export default CoffeeInfoBoard;

const styles = StyleSheet.create({
    tooltip: {
        alignItems: 'center',
    },
    card: {
        width: 260,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 12 },
        elevation: 6,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
    },
    image: {
        width: '100%',
        height: 120,
        backgroundColor: '#F2F2F7',
    },
    content: {
        padding: 16,
        gap: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    address: {
        fontSize: 14,
        color: '#6E6E73',
    },
    addressSecondary: {
        fontSize: 13,
        color: '#8E8E93',
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
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    distance: {
        fontSize: 13,
        color: '#6E6E73',
    },
    arrow: {
        width: 16,
        height: 16,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
        marginTop: -8,
        borderRadius: 3,
    },
})
