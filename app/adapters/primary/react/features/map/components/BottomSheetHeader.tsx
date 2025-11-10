import {View, Text, StyleSheet} from "react-native";
import {CoffeeLogoCupSteam} from "./svgs/CoffeeLogos"
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";
import SvgComponent from "@/app/adapters/primary/react/features/map/components/SvgComponent";
import {useCommentsForCafe} from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";



type Props = {
    name: string | undefined;
    coffeeId:CoffeeId | undefined;
}

const BottomSheetHeader = (props:Props) => {

const {name, coffeeId} = props;
const {comments} = useCommentsForCafe(coffeeId)


  return (
      <View style={styles.container}>
          <View style={styles.border}>
            <SvgComponent />
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
                      <Text style={styles.legend}>{comments.length}</Text>
                  </View>
              </View>
          </View>
      </View>
  )
};



export default BottomSheetHeader;

const styles = StyleSheet.create({
  container: {
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