import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

export const uploadPrivateFile = (input: {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	localUri: string;
}) => expoFetch(input.url, {
	method: input.method ?? "PUT",
	headers: input.headers ?? {},
	body: new File(input.localUri),
});
