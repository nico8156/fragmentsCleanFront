import {Coffee} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {Callout} from "react-native-maps";
import {View,Text, StyleSheet} from "react-native";

type Props = {
    coffee:Coffee;
}

const CoffeeInfoBoard = (props:Props) => {

    const {coffee} = props;

    return (
    <Callout>
        <View style={{height:250, width:300}}>
            <Text>
                {coffee.name}
            </Text>
        </View>
    </Callout>
    )
}

export default CoffeeInfoBoard;

const styles = StyleSheet.create({

})