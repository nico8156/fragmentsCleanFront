import {View, StyleSheet, Pressable} from "react-native";
import {SymbolView} from "expo-symbols";
import {SFSymbols6_0} from "sf-symbols-typescript";

type Props = {
    size:number;
    name:SFSymbols6_0;
    color:string;
    localizeMe:() => void;
    isFollowing?: boolean;
}

const LocalisationButton = (props:Props) => {

    const {size, name,color, localizeMe, isFollowing} = props;

    return (
        <View style={[styles.container, isFollowing ? styles.following : styles.idle]}>
            <Pressable onPress={localizeMe} hitSlop={8}>
                <SymbolView name={name} size={size} tintColor={color}/>
            </Pressable>
        </View>
    )
}

export default LocalisationButton;

const styles = StyleSheet.create({
    container:{
        position:"absolute",
        bottom:32,
        right:24,
        width:56,
        height:56,
        borderRadius:28,
        alignItems:"center",
        justifyContent:"center",
        shadowColor:'#000',
        shadowOpacity:0.1,
        shadowRadius:10,
        shadowOffset:{width:0,height:6},
        elevation:4
    },
    following:{
        backgroundColor:"#FFFFFF",
    },
    idle:{
        backgroundColor:"rgba(60, 60, 67, 0.08)",
    }
})