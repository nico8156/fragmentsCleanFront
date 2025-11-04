import {Pressable, View, StyleSheet} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/constants/colors";
import LocalisationButton from "@/app/adapters/primary/react/components/coffeeSelection/localisationButton";


const ActionButtonsWrapper = () => {

  return(
      <View style={styles.buttonContainer}>
          <Pressable >
              <View style={styles.buttonAppearance}>
                <SymbolView name={'list.bullet.rectangle'} size={28} tintColor={palette.textPrimary} />
              </View>
          </Pressable>
          <Pressable>
              <View style={styles.buttonAppearance}>
                <SymbolView name={'barcode.viewfinder'} size={28} tintColor={palette.success} />
              </View>
          </Pressable>
          {/*<LocalisationButton*/}
          {/*      localizeMe={()=>{}}*/}
          {/*      name={ 'location.circle.fill' }*/}
          {/*      size={28}*/}
          {/*      color={ palette.textSecondary}*/}
          {/*      isFollowing={true}*/}
          {/*  />*/}
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
        backgroundColor:palette.background,
        padding:10,
        borderRadius:25,
        borderWidth:1,
        borderColor:palette.textPrimary,
    }
})