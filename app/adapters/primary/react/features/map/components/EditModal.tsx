import {View, Text, StyleSheet, Pressable, Dimensions} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";

type Props = {
    closeModal:()=> void
}

const EditModal = (props:Props) => {
    const {closeModal} = props;
  return(
      <Pressable onPress={closeModal} style={styles.inlay}>
          <View style={styles.container} >
              <View style={styles.button}>
                  <SymbolView name={"pencil"} size={25} tintColor={"grey"}/>
                  <Text>Edit</Text>
              </View>
              <View style={styles.button}>
                  <SymbolView name={"trash"} size={25} tintColor={palette.danger}/>
                  <Text style={{color:palette.danger}}>Supprimer</Text>
              </View>
          </View>
      </Pressable>
  );
};

export default EditModal;

const styles = StyleSheet.create({
    inlay:{
        zIndex:100,
        width:Dimensions.get('window').width,
        height:Dimensions.get('window').height,
        backgroundColor:"rgba(0,0,0,0.5)",
        position:'absolute',
        borderWidth:5,
        borderColor:"pink",
        justifyContent:'center',
        alignItems:'center',
    },
    container:{
        zIndex:101,
        position:'absolute',
        borderWidth:1,
        borderColor:"black",
        flexDirection:'column',
        padding:10,
        paddingRight:100,
        gap:10,
    },
    button:{
        flexDirection:'row',
        alignItems:'center',
        gap:10,

    }
});