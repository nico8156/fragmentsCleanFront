import {View, Text, StyleSheet} from "react-native";
import {CoffeeLogoCupSteam} from "./svgs/CoffeeLogos"
import {SymbolView} from "expo-symbols";
import {palette} from "@/constants/colors";

const BottomSheetHeader = () => {

  return (
      <View style={styles.container}>
          <CoffeeLogoCupSteam width={70} height={70}/>
          <View >
              <Text style={styles.name}>Nom du Resto</Text>
              <View style={styles.socialContainer}>
                  <View style={styles.socialContainer}>
                      <SymbolView name={'heart.fill'} size={16}  tintColor={palette.textPrimary}/>
                      <Text >45</Text>
                  </View>
                  <View style={styles.socialContainer}>
                      <SymbolView name={'bubble.fill'} size={16} tintColor={palette.textPrimary}/>
                      <Text>23</Text>
                  </View>
              </View>
          </View>
      </View>
  )
};



export default BottomSheetHeader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: palette.textSecondary ,
      flexDirection: 'row'
  },
    socialContainer:{
      flexDirection: 'row',
        alignItems: 'center',
    },
    name:{
      fontSize: 18,
        fontWeight: '500',
    }
})