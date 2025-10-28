import {CoffeeId} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";

export const selectOpeningHoursForCoffeeId = (id:CoffeeId) => (state:RootStateWl) => state.ohState.byCoffeeId[id];