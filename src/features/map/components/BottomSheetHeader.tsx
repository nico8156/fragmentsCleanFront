import {View, Text, StyleSheet} from "react-native";
import {CoffeeLogoCupSteam} from "./svgs/CoffeeLogos"
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";


type Props = {
    name: string | undefined;
}

const BottomSheetHeader = (props:Props) => {
const {name} = props;
  return (
      <View style={styles.container}>
          <View style={styles.border}>
            <CoffeeLogoCupSteam width={70} height={70}/>
          </View>
          <View style={{marginLeft: 5}}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.socialsContainer}>
                  <View style={styles.socialContainer}>
                      <SymbolView name={'heart.fill'} size={25}   tintColor={"lightgray"}/>
                      <Text style={styles.legend}>45</Text>
                  </View>
                  <View style={styles.socialContainer}>
                      <SymbolView name={'bubble.fill'} size={25}  tintColor={"lightgray"}/>
                      <Text style={styles.legend}>23</Text>
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
      backgroundColor: palette.textPrimary_1 ,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
  },
    border:{
      borderWidth: 1,
        borderColor: palette.success_30,
    },
    socialsContainer:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    socialContainer:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
        color: palette.textPrimary_30,
    },
    name:{
      fontSize: 16,
        fontWeight: '700',
    },
    legend:palette.font14
})