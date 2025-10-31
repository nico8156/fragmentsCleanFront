import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";

export const selectPhotosForCoffeeId = (id:CoffeeId) => (state:RootStateWl) => state.pState.byCoffeeId[id];