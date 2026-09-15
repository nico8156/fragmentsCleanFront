import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { myExperiencesRetrieval } from "@/app/core-logic/contextWL/experienceWl/usecases/read/experienceRetrieval";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";
import { selectHomeExperiences } from "./homeContentViewModel";

export function useHomeExperiences() {
	const dispatch = useDispatch<AppDispatchWl>();
	useFocusEffect(useCallback(() => {
		// Private media links expire even when the experience itself has not changed.
		dispatch(myExperiencesRetrieval());
	}, [dispatch]));
	return useSelector(selectHomeExperiences);
}
