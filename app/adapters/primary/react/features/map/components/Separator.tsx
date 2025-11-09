import {View, StyleSheet} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";

const Separator = () => {
    return(
        <View style={{flex:1, paddingHorizontal:10}}>
            <View style={styles.container}></View>
        </View>
    )
};
export default Separator;
 const styles = StyleSheet.create({
     container:{
         height:1,
         width:'100%',
         backgroundColor: palette.textMuted_30,
     }
 })
