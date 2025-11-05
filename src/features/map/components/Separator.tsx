import {View, StyleSheet} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";

const Separator = () => {
    return(
        <View style={styles.container}>

        </View>
    )
};
export default Separator;
 const styles = StyleSheet.create({
     container:{
         height:1,
         width:'96%',
         backgroundColor: palette.textMuted_30,
         marginVertical:30,
     }
 })
