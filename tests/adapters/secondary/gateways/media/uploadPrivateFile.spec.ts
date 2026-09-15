const mockExpoFetch = jest.fn();
const mockFile = jest.fn((uri: string) => ({ uri, marker: "expo-file" }));

jest.mock("expo/fetch", () => ({ fetch: (...args: unknown[]) => mockExpoFetch(...args) }));
jest.mock("expo-file-system", () => ({ File: function File(uri: string) { return mockFile(uri); } }));

// Native technical boundaries must be mocked before loading their adapter.
// eslint-disable-next-line import/first
import { uploadPrivateFile } from "@/app/adapters/secondary/gateways/media/uploadPrivateFile";

describe("uploadPrivateFile", () => {
	it("sends the Expo File as the binary body through expo/fetch", async () => {
		mockExpoFetch.mockResolvedValueOnce({ ok: true, status: 200 });

		await uploadPrivateFile({
			url: "https://signed.test/object",
			method: "PUT",
			headers: { "Content-Type": "image/jpeg" },
			localUri: "file:///documents/pending-private-media/photo.jpg",
		});

		expect(mockExpoFetch).toHaveBeenCalledWith("https://signed.test/object", {
			method: "PUT",
			headers: { "Content-Type": "image/jpeg" },
			body: { uri: "file:///documents/pending-private-media/photo.jpg", marker: "expo-file" },
		});
	});
});
