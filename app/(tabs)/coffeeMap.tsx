import { StyleSheet,View} from "react-native";
import MapView from "react-native-maps";
import {useSelector} from "react-redux";
import CoffeeSelection from "@/app/adapters/primary/react/components/coffeeSelection/coffeeSelection";

const CoffeeMap = () => {

    const {lat,lon} = useSelector((s:any) => s.lcState)

    return <View style={styles.container}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude:  lat,
                        longitude: lon,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    showsUserLocation={true}
                >
                    <CoffeeSelection/>
                </MapView>
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