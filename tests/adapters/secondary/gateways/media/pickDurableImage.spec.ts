const mockLaunchLibrary = jest.fn();
const mockRender = jest.fn();
const mockResize = jest.fn();
const mockSave = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockRequestLibraryPermission = jest.fn();
const mockManipulate = jest.fn();
const mockRequireOptionalNativeModule = jest.fn();

jest.mock("expo-crypto", () => ({ randomUUID: () => "11111111-1111-4111-8111-111111111111" }));

jest.mock("expo-modules-core", () => ({
	requireOptionalNativeModule: (...args: unknown[]) => mockRequireOptionalNativeModule(...args),
}));

jest.mock("expo-image-picker", () => ({
	launchImageLibraryAsync: (...args: unknown[]) => mockLaunchLibrary(...args),
	launchCameraAsync: jest.fn(),
	requestCameraPermissionsAsync: jest.fn(),
	requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockRequestLibraryPermission(...args),
	UIImagePickerPreferredAssetRepresentationMode: { Compatible: "compatible" },
}));

jest.mock("expo-image-manipulator", () => ({
	ImageManipulator: {
		manipulate: (...args: unknown[]) => mockManipulate(...args),
	},
	SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("expo-file-system", () => {
	class Directory {
		uri = "file:///documents/pending-private-media";
		create = jest.fn();
	}
	class File {
		uri: string;
		exists = true;
		constructor(first: string | Directory, second?: string) {
			this.uri = typeof first === "string" ? first : `${first.uri}/${second}`;
		}
		get type() {
			if (this.uri.endsWith(".jpg") || this.uri.endsWith(".jpeg")) return "image/jpeg";
			if (this.uri.endsWith(".png")) return "image/png";
			if (this.uri.endsWith(".heic")) return "image/heic";
			return "";
		}
		copy(destination: File) { mockCopy(this.uri, destination.uri); }
		delete() { mockDelete(this.uri); }
		info() { return { size: 1_500_000 }; }
	}
	return { Directory, File, Paths: { document: "file:///documents" } };
});

/*
	The following helper is installed as the default mock implementation in each
	test so individual cases can simulate an older native binary.
*/
const installManipulator = () => mockManipulate.mockImplementation(() => ({
	resize: mockResize.mockReturnThis(),
	renderAsync: mockRender,
}));

// The import must follow native-module mock registration in this adapter test.
// eslint-disable-next-line import/first
import { pickDurableImage } from "@/app/adapters/secondary/gateways/media/pickDurableImage";

describe("pickDurableImage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRequireOptionalNativeModule.mockReturnValue({});
		installManipulator();
		mockLaunchLibrary.mockResolvedValue({
			canceled: false,
			assets: [{ uri: "file:///iphone.heic", mimeType: "image/heic", width: 4032, height: 3024 }],
		});
		mockRender.mockResolvedValue({ saveAsync: mockSave });
		mockSave.mockResolvedValue({ uri: "file:///cache/normalized.jpg", width: 1600, height: 1200 });
	});

	it("keeps an older native binary boot-safe and accepts its compatible JPEG picker result", async () => {
		mockRequireOptionalNativeModule.mockReturnValueOnce(null);
		mockLaunchLibrary.mockResolvedValueOnce({
			canceled: false,
			assets: [{ uri: "file:///cache/compatible.jpg", mimeType: "image/heic", width: 1200, height: 900 }],
		});

		const result = await pickDurableImage("library");

		expect(result?.contentType).toBe("image/jpeg");
		expect(mockRequireOptionalNativeModule).toHaveBeenCalledWith("ExpoImageManipulator");
		expect(mockManipulate).not.toHaveBeenCalled();
		expect(mockCopy).toHaveBeenCalledWith("file:///cache/compatible.jpg", expect.stringMatching(/pending-private-media\/.*\.jpg$/));
		expect(mockDelete).not.toHaveBeenCalledWith("file:///cache/compatible.jpg");
	});

	it("explains that a raw HEIC needs the rebuilt binary instead of crashing the app", async () => {
		mockRequireOptionalNativeModule.mockReturnValueOnce(null);

		await expect(pickDurableImage("library")).rejects.toThrow("nouveau build de Fragments");
		expect(mockManipulate).not.toHaveBeenCalled();
	});

	it("normalizes an iPhone HEIC asset to a durable bounded JPEG", async () => {
		const result = await pickDurableImage("library");

		expect(mockResize).toHaveBeenCalledWith({ width: 1600, height: null });
		expect(mockRequestLibraryPermission).not.toHaveBeenCalled();
		expect(mockSave).toHaveBeenCalledWith({ compress: 0.82, format: "jpeg" });
		expect(mockCopy).toHaveBeenCalledWith("file:///cache/normalized.jpg", expect.stringMatching(/pending-private-media\/.*\.jpg$/));
		expect(mockDelete).toHaveBeenCalledWith("file:///cache/normalized.jpg");
		expect(result).toMatchObject({
			contentType: "image/jpeg",
			size: 1_500_000,
			width: 1600,
			height: 1200,
		});
	});
});
