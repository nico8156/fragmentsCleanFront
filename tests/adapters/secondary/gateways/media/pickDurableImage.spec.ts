const mockLaunchLibrary = jest.fn();
const mockRender = jest.fn();
const mockResize = jest.fn();
const mockSave = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockRequestLibraryPermission = jest.fn();

jest.mock("expo-image-picker", () => ({
	launchImageLibraryAsync: (...args: unknown[]) => mockLaunchLibrary(...args),
	launchCameraAsync: jest.fn(),
	requestCameraPermissionsAsync: jest.fn(),
	requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockRequestLibraryPermission(...args),
	UIImagePickerPreferredAssetRepresentationMode: { Compatible: "compatible" },
}));

jest.mock("expo-image-manipulator", () => ({
	ImageManipulator: {
		manipulate: jest.fn(() => ({
			resize: mockResize.mockReturnThis(),
			renderAsync: mockRender,
		})),
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
		copy(destination: File) { mockCopy(this.uri, destination.uri); }
		delete() { mockDelete(this.uri); }
		info() { return { size: 1_500_000 }; }
	}
	return { Directory, File, Paths: { document: "file:///documents" } };
});

// The import must follow native-module mock registration in this adapter test.
// eslint-disable-next-line import/first
import { pickDurableImage } from "@/app/adapters/secondary/gateways/media/pickDurableImage";

describe("pickDurableImage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockLaunchLibrary.mockResolvedValue({
			canceled: false,
			assets: [{ uri: "file:///iphone.heic", mimeType: "image/heic", width: 4032, height: 3024 }],
		});
		mockRender.mockResolvedValue({ saveAsync: mockSave });
		mockSave.mockResolvedValue({ uri: "file:///cache/normalized.jpg", width: 1600, height: 1200 });
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
