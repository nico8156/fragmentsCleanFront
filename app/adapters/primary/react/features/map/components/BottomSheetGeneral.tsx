import {Text, View, StyleSheet} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";

const BottomSheetGeneral = () => {
    return(
        <View style={styles.container}>
            <Text style={styles.titleText}>
                General
            </Text>
        </View>
    )
}
export default BottomSheetGeneral;

const styles = StyleSheet.create({
    container:{
        marginTop: 30,
        padding: 10,
    },
    titleText:{
        fontSize: 18,
        fontWeight: 'semibold',
        color: palette.success_1,
    },

})