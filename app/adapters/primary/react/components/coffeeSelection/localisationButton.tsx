import {View, StyleSheet, Pressable} from "react-native";
import {SymbolView} from "expo-symbols";
import {SFSymbols6_0} from "sf-symbols-typescript";

type Props = {
    size:number;
    name:SFSymbols6_0;
    color:string;
    localizeMe:() => void;
}

const LocalisationButton = (props:Props) => {

    const {size, name,color, localizeMe} = props;

    return (
        <View style={styles.container}>
            <Pressable onPress={localizeMe}>
                <SymbolView name={name} size={size} tintColor={color}/>
            </Pressable>
        </View>
    )
}

export default LocalisationButton;

const styles = StyleSheet.create({
    container:{
        position:"absolute",
        bottom:100,
        right:15,
        width:50,
        height:50,
        backgroundColor:"rgba(60, 60, 67, 0.08)",
        borderRadius:25,
        alignItems:"center",
        justifyContent:"center"
    }
})