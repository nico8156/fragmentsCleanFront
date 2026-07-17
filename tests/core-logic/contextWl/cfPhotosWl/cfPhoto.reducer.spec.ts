import { cfPhotoReducer } from "@/app/core-logic/contextWL/cfPhotosWl/reducer/cfPhoto.reducer";
import { photosHydrated } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";

describe("cfPhotoReducer", () => {
	it("replaces stale signed photo urls with the latest snapshot", () => {
		const stale = cfPhotoReducer(undefined, photosHydrated({
			photos: [
				{
					id: "photo-1",
					coffee_id: "coffee-1",
					photo_uri: "https://cdn.example/coffee-1.jpg?X-Amz-Date=20260708T160440Z&X-Amz-Expires=900",
				},
			],
		}));

		const refreshed = cfPhotoReducer(stale, photosHydrated({
			photos: [
				{
					id: "photo-1",
					coffee_id: "coffee-1",
					photo_uri: "https://cdn.example/coffee-1.jpg?X-Amz-Date=20260717T111500Z&X-Amz-Expires=900",
				},
			],
		}));

		expect(refreshed.byCoffeeId["coffee-1"]).toEqual([
			"https://cdn.example/coffee-1.jpg?X-Amz-Date=20260717T111500Z&X-Amz-Expires=900",
		]);
	});

	it("keeps only unique photo urls inside the latest snapshot", () => {
		const state = cfPhotoReducer(undefined, photosHydrated({
			photos: [
				{ id: "1", coffee_id: "coffee-1", photo_uri: "https://cdn.example/a.jpg" },
				{ id: "2", coffee_id: "coffee-1", photo_uri: "https://cdn.example/a.jpg" },
				{ id: "3", coffee_id: "coffee-1", photo_uri: "https://cdn.example/b.jpg" },
			],
		}));

		expect(state.byCoffeeId["coffee-1"]).toEqual([
			"https://cdn.example/a.jpg",
			"https://cdn.example/b.jpg",
		]);
	});
});
