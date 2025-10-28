import {createAction} from "@reduxjs/toolkit";
import {PhotoURI} from "@/app/contextWL/cfPhotosWl/typeAction/cfPhoto.type";

//export const coffeePhotosRequested = createAction("SERVER/COFFEE_PHOTOS/REQUESTED");
export const photosHydrated = createAction<{ photos :PhotoURI[] }>("SERVER/PHOTOS/HYDRATED");