import {useSelector} from "react-redux";
import {AppStateWl} from "@/app/store/appStateWl";
import CoffeeMarker from "@/app/adapters/primary/react/components/coffeeSelection/coffeeMarker";

const CoffeeSelection = () => {

const ids = useSelector((s:any)=>s.cfState.ids) as AppStateWl["coffees"]["ids"]

    return(<>
        {ids.map(id=> <CoffeeMarker key={id} id={id}/>)}
    </>)
}

export default CoffeeSelection;