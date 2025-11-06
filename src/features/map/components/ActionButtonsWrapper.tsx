import {Pressable, View, StyleSheet} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";
import LocalisationButton from "@/app/adapters/primary/react/components/coffeeSelection/localisationButton";
import {RootStackNavigationProp} from "@/src/navigation/types";
import {useNavigation} from "@react-navigation/native";

type Props = {
    toggleViewMode:()=>void;
}

const ActionButtonsWrapper = (props:Props) => {
    const {toggleViewMode} = props;

    const navigation = useNavigation<RootStackNavigationProp>();

    const openScanModal = () => {
        navigation.navigate("ScanTicketModal");
    };
  return(
      <View style={styles.buttonContainer}>
          <Pressable onPress={toggleViewMode}>
              <View style={styles.buttonAppearance}>
                <SymbolView name={'list.bullet.rectangle'} size={28} tintColor={palette.accent} />
              </View>
          </Pressable>
          <Pressable onPress={openScanModal}>
              <View style={styles.buttonAppearance}>
                <SymbolView name={'barcode.viewfinder'} size={28} tintColor={palette.accent} />
              </View>
          </Pressable>
      </View>
  //     <>
  //     <View style={[styles.overlayHeader, { paddingTop: insets.top + 18 }]}>
  //         <Pressable
  //             onPress={toggleViewMode}
  //             style={styles.overlayToggle}
  //             accessibilityRole="button"
  //             accessibilityLabel="Afficher la liste"
  //         >
  //             <SymbolView name={'list.bullet.rectangle'} size={22} tintColor={palette.textPrimary} />
  //         </Pressable>
  //         <Pressable
  //             onPress={openScanModal}
  //             style={styles.overlayToggle}>
  //             <SymbolView name={'barcode.viewfinder'} size={22} tintColor={palette.success} />
  //         </Pressable>
  //     </View>
  //   <LocalisationButton
  //       localizeMe={localizeMe}
  //       name={isFollowingUser ? 'location.circle.fill' : 'location'}
  //       size={28}
  //       color={isFollowingUser ? palette.accent : palette.textSecondary}
  //       isFollowing={isFollowingUser}
  //   />
  // </>
  )
};
export default ActionButtonsWrapper;

const styles = StyleSheet.create({
    buttonContainer:{
        position:"absolute",
        top:60,
        height:50,
        width:"100%",
        flexDirection:"row",
        justifyContent:"space-between",
        paddingHorizontal:20,
        elevation:6
    },
    buttonAppearance:{
        backgroundColor:palette.bg_light_90,
        padding:10,
        borderRadius:25,
        borderWidth:1,
        borderColor:palette.textPrimary,
    }
})