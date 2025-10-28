import {useDispatch} from "react-redux";
import {useEffect} from "react";
import {userLocationRequested} from "@/app/contextWL/locationWl/typeAction/location.action";
import {coffeeGlobalRetrieval} from "@/app/contextWL/coffeeWl/usecases/read/coffeeRetrieval";

const AppInitializer = () => {
    const dispatch = useDispatch<any>()
    useEffect(() => {
        dispatch(userLocationRequested())
        dispatch(coffeeGlobalRetrieval())
    }, []);
    return null
}

export default AppInitializer