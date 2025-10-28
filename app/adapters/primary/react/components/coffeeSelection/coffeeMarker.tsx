import {Marker} from "react-native-maps";
import { parseToCoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeInfoBoard from "@/app/adapters/primary/react/components/coffeeSelection/coffeeInfoBoard";
import {useCoffeeCoordinates} from "@/app/adapters/secondary/viewModel/useCoffeeCoordinates";

type Props = {
    id: string
}

const CoffeeMarker = (props:Props) => {

    const id = parseToCoffeeId(props.id);
    const {lat, lon} = useCoffeeCoordinates(id)

    return(
        <Marker
            coordinate={{latitude: lat, longitude: lon}}>
                <CoffeeInfoBoard coffeeId={id}/>
        </Marker>
    )
}

export default CoffeeMarker;