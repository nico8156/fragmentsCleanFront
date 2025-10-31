import { Marker } from "react-native-maps";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeInfoBoard from "@/app/adapters/primary/react/components/coffeeSelection/coffeeInfoBoard";
import {useCoffeeCoordinates} from "@/app/adapters/secondary/viewModel/useCoffeeCoordinates";
import { useRef } from "react";
import { View, StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";

type Props = {
    id: string
}

const CoffeeMarker = (props:Props) => {

    const id = parseToCoffeeId(props.id);
    const {lat, lon} = useCoffeeCoordinates(id)
    const markerRef = useRef<any>(null)

    const handleClose = () => {
        markerRef.current?.hideCallout()
    }

    return(
        <Marker
            ref={markerRef}
            coordinate={{latitude: lat, longitude: lon}}
            anchor={{x:0.5,y:1}}
            calloutAnchor={{x:0.5,y:0.15}}
            tracksViewChanges={false}
        >
            <View style={styles.markerWrapper}>
                <View style={styles.markerCore}>
                    <SymbolView name={'cup.and.saucer.fill'} size={16} tintColor={'#FFFFFF'} />
                </View>
                <View style={styles.markerTip}/>
            </View>
            <CoffeeInfoBoard coffeeId={id} onRequestClose={handleClose}/>
        </Marker>
    )
}

export default CoffeeMarker;

const styles = StyleSheet.create({
    markerWrapper: {
        alignItems: 'center',
    },
    markerCore: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    markerTip: {
        width: 10,
        height: 10,
        backgroundColor: '#1C1C1E',
        transform: [{ rotate: '45deg' }],
        marginTop: -4,
        borderRadius: 1.5,
    },
})