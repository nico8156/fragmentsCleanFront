import {View, Text, StyleSheet} from "react-native";
import {SymbolView} from "expo-symbols";
import {Address} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {palette} from "@/app/adapters/primary/react/css/colors";

type Props = {
    isOpen:boolean;
    address:Address |undefined;
    openingTodayHours: string
}

const GeneralComponent = (props:Props) => {
    const {isOpen,address, openingTodayHours} = props;

  return(
      address === undefined ? null :
      <View style={styles.container}>
          <View style={styles.lineContainer}>
              <SymbolView name={'mappin.and.ellipse'} size={25}  tintColor={"grey"}/>
              <View style={{flexDirection:'row'}}>
                  <Text style={styles.address}>{address.line1},</Text>
                  <Text style={styles.address}> {address.postalCode},</Text>
                  <Text style={styles.address}> {address.city},</Text>
                  <Text style={styles.address}> {address.country}</Text>
              </View>
          </View>
          <View style={styles.lineContainer}>
              <SymbolView name={'clock'} size={25}  tintColor={"grey"}/>
              {isOpen ? <Text style={styles.ouvert}>Ouvert</Text> : <Text style={styles.ferme}>Fermé</Text>}
              <Text>{openingTodayHours}</Text>
          </View>
          <View style={styles.lineContainer}>
              <SymbolView name={'eurosign.circle'} size={25}  tintColor={"grey"}/>
              <Text>€</Text>
          </View>
      </View>
  )
};

export default GeneralComponent;

const styles = StyleSheet.create({
    container:{
        padding:10,
    },
    lineContainer:{
      flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    address:{
        fontWeight: '700',
        textDecorationLine:"underline"
    },
    ouvert:{
        color:palette.success_1,
        fontWeight: '500',
    },
    ferme:{
        color:palette.danger_1,
        fontWeight: '500',
    }
})