const mockDelete = jest.fn();
const mockFile = jest.fn((uri: string) => ({ uri, exists: true, delete: mockDelete }));

jest.mock("expo-file-system", () => ({ File: function File(uri: string) { return mockFile(uri); } }));

// Native technical boundary is mocked before loading its adapter.
// eslint-disable-next-line import/first
import { ExpoLocalPrivateMediaGateway } from "@/app/adapters/secondary/gateways/media/ExpoLocalPrivateMediaGateway";

describe("ExpoLocalPrivateMediaGateway", () => {
	beforeEach(() => jest.clearAllMocks());

	it("deletes only app-owned durable private media", () => {
		const gateway = new ExpoLocalPrivateMediaGateway();

		gateway.discard("file:///documents/pending-private-media/avatar.jpg");
		gateway.discard("file:///cache/provider-photo.jpg");
		gateway.discard("https://cdn.test/avatar.jpg");

		expect(mockFile).toHaveBeenCalledTimes(1);
		expect(mockDelete).toHaveBeenCalledTimes(1);
	});
});
