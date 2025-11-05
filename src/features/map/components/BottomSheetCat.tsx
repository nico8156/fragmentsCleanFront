import {View, Text, StyleSheet} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";
import {SymbolView} from "expo-symbols";

type Props = {
    isOpen: boolean | undefined;
}

const BottomSheetCat = (props:Props) => {
    const {isOpen} = props;

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
                <Text style={styles.openingHours}>Ouvre 19:30 Ven</Text>
                <View style={styles.point}></View>
                <View style={styles.distanceContainer}>
                    <SymbolView name={'figure.walk'} size={22} tintColor={"grey"} />
                    <Text style={styles.distanceText}>2.7 km</Text>
                </View>
            </View>
        </View>
    )
}

export default BottomSheetCat;

const styles = StyleSheet.create({
    wrapper:{
        marginTop: 20,
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    textClosed:{
        color: palette.danger_1,
        fontSize: 18,
        fontWeight: 'bold',
    },
    textOpen:{
        color: palette.success_1,
        fontSize: 18,
        fontWeight: 'bold',
    },
    point:{
        width: 2,
        height: 2,
        backgroundColor: palette.background_1,
        borderRadius: 1,
    },
    openingHours:{
        fontSize: 18,
        fontWeight: 'semibold',
    },
    distanceContainer:{
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText:{
        fontSize: 18,
        fontWeight: 'semibold',
    }
})