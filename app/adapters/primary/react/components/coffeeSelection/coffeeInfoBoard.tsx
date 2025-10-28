import {Callout} from "react-native-maps";
import {View, Text, StyleSheet} from "react-native";
import {Image} from "expo-image";
import {CoffeeId, parseToCoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useCafeFull} from "@/app/adapters/secondary/viewModel/useCafeFull";

type Props = {
    coffeeId:CoffeeId;
}

const CoffeeInfoBoard = (props:Props) => {

    const {coffeeId} = props;
    const {coffee} = useCafeFull(parseToCoffeeId(coffeeId))

    return (
    <Callout>
        <View style={{height:250, width:300}}>
            <Text>
                {coffee.name}
            </Text>
            <Text>
                {coffee.address.city}
            </Text>
            <Image source={coffee.photos[0]} style={{height:150, width:150, borderRadius:75}}  />
        </View>
    </Callout>
    )
}

export default CoffeeInfoBoard;

const styles = StyleSheet.create({

})