import {useSelector} from "react-redux";
import {selectCoordinatesForCoffee} from "@/app/contextWL/coffeeWl/selector/coffeeWl.selector";
import {CoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";

export function useCoffeeCoordinates(id:CoffeeId) {
    const {lat, lon} = useSelector(selectCoordinatesForCoffee(id))
    return {lat, lon}
}