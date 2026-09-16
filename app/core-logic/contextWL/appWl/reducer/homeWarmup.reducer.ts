import { createReducer } from "@reduxjs/toolkit";
import { homeImagesWarming, homeImagesSettled } from "../typeAction/homeWarmup.action";

export const homeImagesReducer = createReducer({ warming: false }, builder => builder
	.addCase(homeImagesWarming, state => { state.warming = true; })
	.addCase(homeImagesSettled, state => { state.warming = false; }));
