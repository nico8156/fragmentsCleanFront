import {View, Text, StyleSheet} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";
import {SymbolView} from "expo-symbols";

type Props = {
    openingHoursToday: string | undefined;
    isOpen: boolean | undefined;
    distance: string | undefined;
}

const BottomSheetCat = (props:Props) => {
    const {openingHoursToday,isOpen, distance} = props;

    return(
        <View style={styles.wrapper}>
            <View style={styles.containerCat}>
                <Text style={styles.textCat}>COFFEE SHOP</Text>
            </View>
            <View style={styles.containerDetails}>
                {isOpen ?
                    <Text style={styles.textOpen}>Ouvert</Text>
                    :
                    <Text style={styles.textClosed}>Fermé</Text>
                }
                <View style={styles.point}></View>
                <Text style={styles.openingHours}>{openingHoursToday}</Text>
                <View style={styles.point}></View>
                <View style={styles.distanceContainer}>
                    <SymbolView name={'figure.walk'} size={22} tintColor={"grey"} />
                    <Text style={styles.distanceText}>{distance}</Text>
                </View>
            </View>
        </View>
    )
}

export default BottomSheetCat;

const styles = StyleSheet.create({
    wrapper:{
        marginTop: 20,
        padding: 10,
    },
    containerCat: {
        flexDirection: 'row',
        color: 'red',
        alignItems: 'center',
    },
    containerDetails:{
        marginTop: 5,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    textCat:{
        color: palette.accent_80,
        fontSize: 16,
        fontWeight: '600',
    },
    textClosed:{
        color: palette.danger_1,
        fontSize: 18,
        fontWeight: '600',
    },
    textOpen:{
        color: palette.success_1,
        fontSize: 18,
        fontWeight: 'semibold',
    },
    point:{
        width: 2,
        height: 2,
        backgroundColor: palette.background_1,
        borderRadius: 1,
    },
    openingHours:{
        fontSize: 16,
        fontWeight: 'semibold',
    },
    distanceContainer:{
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText:{
        fontSize: 16,
        fontWeight: 'semibold',
    }
})