import { StyleSheet,View} from "react-native";
import MapView from "react-native-maps";
import CoffeeSelection from "@/app/adapters/primary/react/components/coffeeSelection/coffeeSelection";
import LocalisationButton from "@/app/adapters/primary/react/components/coffeeSelection/localisationButton";
import {useRef} from "react";
import {useUserLocationFromStore} from "@/app/adapters/secondary/viewModel/useUserLocation";

const CoffeeMap = () => {

    const {coords,refresh} = useUserLocationFromStore()

    const mapRef = useRef<MapView>(null)

    const localizeMe = () => {
        refresh()
        mapRef.current?.animateToRegion({
            latitude: coords?.lat || 0,
            longitude: coords?.lng || 0,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
        });
    }

    return <View style={styles.container}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    showsMyLocationButton={true}
                    initialRegion={{
                        latitude:  coords!.lat,
                        longitude: coords!.lng,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    showsUserLocation={true}
                >
                    <CoffeeSelection/>
                </MapView>
                <LocalisationButton localizeMe={localizeMe} name="paperplane.circle" size={45} color="#8E8E93"/>
            </View>
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
})
export default CoffeeMap;