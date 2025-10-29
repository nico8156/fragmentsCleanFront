import {Callout} from "react-native-maps";
import {View, Text, StyleSheet} from "react-native";
import {Image} from "expo-image";
import {CoffeeId, parseToCoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useCafeFull} from "@/app/adapters/secondary/viewModel/useCafeFull";
import {CafeFullVM} from "@/app/contextWL/coffeeWl/selector/coffeeWl.selector";
import {useDistanceToPoint} from "@/app/adapters/secondary/viewModel/useDistanceToPoint";
import {useCafeOpenNow} from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import {SymbolView} from "expo-symbols";

type Props = {
    coffeeId:CoffeeId;
}

const CoffeeInfoBoard = (props:Props) => {

    const coffeeId = parseToCoffeeId(props.coffeeId);
    const {coffee}:{coffee:CafeFullVM|undefined} = useCafeFull(coffeeId)
    const distance = useDistanceToPoint({lat:coffee!.location.lat,lng:coffee!.location.lon})
    const isOpen = useCafeOpenNow(coffeeId)

    return coffee &&(
    <Callout>
        <View style={{height:250, width:300}}>
            <Text>
                {coffee.name}
            </Text>
            <Text>
                {coffee.address.city}
            </Text>
            <Image source={coffee.photos[0]} style={{height:150, width:150}}  />
            <Text>
                {"lundi : " + coffee.hours["1"].label}
            </Text>
            <Text>
                {"distance : " + distance.text }
            </Text>
            {isOpen ? <SymbolView name={"sun.horizon.fill"} tintColor={"green"} size={25}/> : <SymbolView name={"moon.zzz"} tintColor={"red"} size={25}/>}

        </View>
    </Callout>
    )
}

export default CoffeeInfoBoard;

const styles = StyleSheet.create({

})