import { formatDistance, haversineKm } from "@/app/core-logic/utils/geo/distance";

describe("coffee distance", () => {
    it("computes a real geographic distance from user and coffee coordinates", () => {
        const distance = haversineKm(48.8566, 2.3522, 48.8606, 2.3376);
        expect(distance).toBeGreaterThan(1);
        expect(distance).toBeLessThan(1.3);
    });

    it("formats nearby distances in meters", () => {
        expect(formatDistance(0.23, "fr-FR")).toContain("230");
    });
});
