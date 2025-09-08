import {applyValidation, isDuplicate} from "@/app/store/appState";

describe("ticket domain", () => {
    it("applyValidation incrémente une seule fois", () => {
        const gp = { validCount: 0, validatedIds: new Set<string>() };
        const after1 = applyValidation(gp, "t1", true);
        const after2 = applyValidation(after1, "t1", true);
        expect(after1.validCount).toBe(1);
        expect(after2.validCount).toBe(1);
        expect(isDuplicate("t1", after2)).toBe(true);
    });
});
