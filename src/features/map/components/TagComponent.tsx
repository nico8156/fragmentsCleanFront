import {View, Text, StyleSheet} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";

const TagComponent = () => {
    

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Général</Text>
            <View style={styles.tagContainer}>
                <View style={styles.tag}>
                    <SymbolView name={'cup.and.heat.waves'} tintColor={"black"} size={15} weight={"bold"}/>
                    <Text style={styles.tagText}>Café</Text>
                </View>
                <View style={styles.tag}>
                    <SymbolView name={'wifi'} tintColor={"black"} size={15} weight={"bold"}/>
                    <Text style={styles.tagText}>Wifi</Text>
                </View>
                <View style={styles.tag}>
                    <SymbolView name={'fork.knife'} tintColor={"black"} size={15} weight={"bold"}/>
                    <Text style={styles.tagText}>Petit Déjeuner</Text>
                </View>
            </View>
        </View>
    )
}

export default TagComponent;

const styles = StyleSheet.create({
    container:{
        padding:10,
    },
    tagContainer:{
        marginTop: 15,
        marginBottom: 15,
      display:"flex",
        flexDirection:"row",
        flexWrap:"wrap",
        gap: 10,
    },
    title:{
        fontWeight: '500',
    },
    tag:{
        backgroundColor: palette.primary_10,
        borderWidth: 2,
        borderColor: palette.primary_10,
        borderRadius: 50,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    tagText:{
        fontWeight: '400',
    }
})