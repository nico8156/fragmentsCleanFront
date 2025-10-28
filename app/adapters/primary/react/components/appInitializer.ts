import {useDispatch} from "react-redux";
import {useEffect} from "react";
import {userLocationRequested} from "@/app/contextWL/locationWl/typeAction/location.action";

const AppInitializer = () => {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(userLocationRequested())
    }, []);
    return null
}

export default AppInitializer