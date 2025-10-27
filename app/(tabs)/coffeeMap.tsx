import { StyleSheet,View} from "react-native";
import MapView from "react-native-maps";


const CoffeeMap = () => {
    return <View style={styles.container}>
        <MapView
            style={styles.map}
            initialRegion={{

                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
        />
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