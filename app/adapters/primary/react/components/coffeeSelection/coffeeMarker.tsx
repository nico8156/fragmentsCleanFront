import {useSelector} from "react-redux";
import {Marker} from "react-native-maps";
import {Coffee, parseToCoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeInfoBoard from "@/app/adapters/primary/react/components/coffeeSelection/coffeeInfoBoard";
import {useCafeFull} from "@/app/adapters/secondary/viewModel/useCafeFull";
import {useCoffeeCoordinates} from "@/app/adapters/secondary/viewModel/useCoffeeCoordinates";

type Props = {
    id: string
}

const CoffeeMarker = (props:Props) => {

    const {id} = props;

    const coffee = useSelector((s:any)=>s.cfState.byId[id]) as Coffee
    const {data} = useCafeFull(parseToCoffeeId(id))
    const {lat, lon} = useCoffeeCoordinates(parseToCoffeeId(id))

    return(
        <Marker
            coordinate={{latitude: coffee.location.lat, longitude: coffee.location.lon}}>
                <CoffeeInfoBoard coffeeId={id}/>
        </Marker>
    )
}

export default CoffeeMarker;