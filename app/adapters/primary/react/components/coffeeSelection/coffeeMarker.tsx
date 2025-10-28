import {useSelector} from "react-redux";
import {Marker} from "react-native-maps";
import {Coffee} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import CoffeeInfoBoard from "@/app/adapters/primary/react/components/coffeeSelection/coffeeInfoBoard";

type Props = {
    id: string
}

const CoffeeMarker = (props:Props) => {

    const {id} = props;

    const coffee = useSelector((s:any)=>s.cfState.byId[id]) as Coffee

    return(
        <Marker
            coordinate={{latitude: coffee.location.lat, longitude: coffee.location.lon}}>
                <CoffeeInfoBoard coffee={coffee}/>
        </Marker>
    )
}

export default CoffeeMarker;