import {View, Text, StyleSheet, Linking, Pressable} from "react-native";
import {SymbolView} from "expo-symbols";
import {palette} from "@/app/adapters/primary/react/css/colors";


type OpenRouteParams = {
    latitude: number;
    longitude: number;
    label?: string;
};

export function openRouteInAppleMaps({ latitude, longitude, label = "Destination" }: OpenRouteParams) {
    const encodedLabel = encodeURIComponent(label);

    // Apple Maps (iOS)
    const appleUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedLabel}`;

    Linking.openURL(appleUrl).catch((err) => {
        console.warn("Failed to open Apple Maps", err);
    });
}

type Props = {
    latitude: number | undefined;
     longitude: number| undefined;
     name: string | undefined;
};

const BottomSheetActions = (props:Props) => {
const {latitude, longitude, name} = props;
    const handleOpenRoute = () => {
        openRouteInAppleMaps({
            latitude: latitude!,
            longitude:longitude!,
            label: name,
        });
    };
    return (
        <View style={styles.wrapper}>
            <Pressable onPress={handleOpenRoute}>
                <View style={[styles.box, styles.active]}>
                        <SymbolView name={'figure.walk'} size={22} tintColor={"white"} weight={"bold"}/>
                        <Text style={[styles.text, styles.active]}>Itinéraire</Text>
                </View>
            </Pressable>
            <View style={styles.box}>
                <SymbolView name={'plus'} size={22} tintColor={"mediumseagreen"} weight={"medium"}/>
                <Text style={styles.text}>Suivre</Text>
            </View>
            <View style={styles.box}>
                <SymbolView name={'square.and.arrow.up'} size={22} tintColor={"mediumseagreen"} weight={"medium"}/>
                <Text style={styles.text}>Partager</Text>
            </View>
        </View>
    );
}
export default BottomSheetActions;

const styles = StyleSheet.create({
    wrapper:{
        marginTop: 30,
        flexDirection:"row",
        gap: 10,
        padding: 10,
    },
    box:{
        borderWidth: 2,
        borderColor: palette.success_1,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        padding: 8,
        gap: 2,
    },
    text:{
        fontSize: 18,
        color: palette.success_1,
    },
    active:{
        backgroundColor: palette.success_1,
        color: "white",
    }
})
