import {useDispatch, useSelector} from "react-redux";
import {selectHasCompletedOnboarding} from "@/app/core-logic/contextWL/appWl/selector/appWl.selector";
import {
    markHasCompletedOnboarding,
    markHasNotCompletedOnboarding
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

export function useOnBoarding () {
    const dispatch = useDispatch()
    const HasCompletedOnboarding = useSelector(selectHasCompletedOnboarding)
    return {
        HasCompletedOnboarding,
        markOnBoardingAsCompleted: () => dispatch(markHasCompletedOnboarding()),
        markHasNOTCompletedOnboarding: () => dispatch(markHasNotCompletedOnboarding())
    } as const
}