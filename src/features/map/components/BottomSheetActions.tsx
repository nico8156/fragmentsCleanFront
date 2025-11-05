import {View, Text, StyleSheet} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";

const BottomSheetActions = () => {

    return (
        <View style={styles.wrapper}>
            <View style={[styles.box, styles.active]}>
                <SymbolView name={'figure.walk'} size={22} tintColor={"white"} weight={"bold"}/>
                <Text style={[styles.text, styles.active]}>Itinéraire</Text>
            </View>
            <View style={styles.box}>
                <SymbolView name={'plus'} size={22} tintColor={"mediumseagreen"} weight={"medium"}/>
                <Text style={styles.text}>Suivre</Text>
            </View>
            <View style={styles.box}>
                <SymbolView name={'square.and.arrow.up'} size={22} tintColor={"mediumseagreen"} weight={"medium"}/>
                <Text style={styles.text}>Partager</Text>
            </View>
        </View>
    );
}
export default BottomSheetActions;

const styles = StyleSheet.create({
    wrapper:{
        marginTop: 30,
        flexDirection:"row",
        gap: 10,
    },
    box:{
        borderWidth: 2,
        borderColor: palette.success_1,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
        gap: 2,
    },
    text:{
        fontSize: 18,
        color: palette.success_1,
    },
    active:{
        backgroundColor: palette.success_1,
        color: "white",
    }
})
