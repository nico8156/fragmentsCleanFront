import { HttpExperienceGateway } from "@/app/adapters/secondary/gateways/experiences/HttpExperienceGateway";

const mockUploadPrivateFile = jest.fn();
jest.mock("@/app/adapters/secondary/gateways/media/uploadPrivateFile", () => ({
	uploadPrivateFile: (...args: unknown[]) => mockUploadPrivateFile(...args),
}));


it.each(["REVIEW_REQUIRED", "REJECTED"])("never exposes a transport URL for %s media", async status => {
 const fetchMock=jest.spyOn(global,"fetch").mockResolvedValue(new Response(JSON.stringify({items:[{experienceId:"e",coffeeId:"c",authorId:"u",message:"Texte",publicationStatus:"PUBLISHED",moderationStatus:"VISIBLE",version:1,media:[{mediaId:"m",position:0,status,url:"https://must-not-render.test/image"}]}]}),{status:200}));
 try {
  const gateway=new HttpExperienceGateway({baseUrl:"https://api.test",getAccessToken:async()=>"token"});
  const page=await gateway.listCoffee({coffeeId:"c",signal:new AbortController().signal});
  expect(page.items[0].media).toEqual([expect.objectContaining({mediaId:"m",status,url:undefined})]);
 } finally { fetchMock.mockRestore(); }
});

describe("HttpExperienceGateway", () => {
	it.each(["create", "update", "publish", "delete", "report", "deleteMedia"] as const)("maps %s outbox commands without leaking the internal discriminator", async method => {
		const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
		const gateway = new HttpExperienceGateway({ baseUrl: "https://api.test", getAccessToken: async () => "token" });
		const command = { kind: "Experience.Internal", commandId: "cmd", experienceId: "e", coffeeId: "c", message: "Visite", publicationStatus: "PUBLISHED" as const, at: "2026-09-11T10:00:00Z", reportId: "r", reason: "SPAM" as const, mediaId: "m" };
		await gateway[method](command);
		const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
		expect(body).not.toHaveProperty("kind");
		expect(body.commandId).toBe("cmd");
	});
	afterEach(() => { mockUploadPrivateFile.mockReset(); jest.restoreAllMocks(); });
	it("maps the transport read model explicitly", async () => {
		jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ items: [{ experienceId: "e", coffeeId: "c", authorId: "u", authorName: "Nicolas", message: "Visite", publicationStatus: "PUBLISHED", moderationStatus: "VISIBLE", createdAt: "2026-09-11T10:00:00Z", updatedAt: "2026-09-11T10:00:00Z", version: 2 }], nextCursor: null }), { status: 200 }));
		const gateway = new HttpExperienceGateway({ baseUrl: "https://api.test", getAccessToken: async () => "token" });
		await expect(gateway.listCoffee({ coffeeId: "c", signal: new AbortController().signal })).resolves.toMatchObject({ items: [{ experienceId: "e", userId: "u", status: "PUBLISHED", version: 2 }] });
		expect(fetch).toHaveBeenCalledWith("https://api.test/api/coffees/c/experiences?", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
	});

	it("publishes a text experience without any ticket field", async () => {
		const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
		const gateway = new HttpExperienceGateway({ baseUrl: "https://api.test", getAccessToken: async () => "token" });
		await gateway.create({ commandId: "cmd", experienceId: "e", coffeeId: "c", message: "Visite", publicationStatus: "PUBLISHED", at: "2026-09-11T10:00:00Z" });
		const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
		expect(body).not.toHaveProperty("ticketId");
		expect(body).toMatchObject({ experienceId: "e", publicationStatus: "PUBLISHED" });
	});

	it("uploads directly to the signed target before confirming the durable command", async () => {
		const fetchMock = jest.spyOn(global, "fetch")
			.mockResolvedValueOnce(new Response(JSON.stringify({ uploadRequired: true, uploadUrl: "https://s3.test/pending", method: "PUT", headers: { "Content-Type": "image/jpeg", "x-amz-server-side-encryption": "AES256" } }), { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 202 }));
		mockUploadPrivateFile.mockResolvedValueOnce(new Response(null, { status: 200 }));
		const gateway = new HttpExperienceGateway({ baseUrl: "https://api.test", getAccessToken: async () => "token" });

		await gateway.uploadMedia({ commandId: "cmd", experienceId: "e", mediaId: "m", image: { localUri: "file:///private/photo.jpg", contentType: "image/jpeg", size: 42 }, at: "2026-09-11T10:00:00Z" });

		expect(fetchMock.mock.calls.map(call => String(call[0]))).toEqual([
			"https://api.test/api/experiences/e/media/upload-intents",
			"https://api.test/api/experiences/e/media/m/confirm",
		]);
		expect(mockUploadPrivateFile).toHaveBeenCalledWith({
			url: "https://s3.test/pending",
			method: "PUT",
			headers: { "Content-Type": "image/jpeg", "x-amz-server-side-encryption": "AES256" },
			localUri: "file:///private/photo.jpg",
		});
	});
});

it.each([true,false,undefined])("only forwards explicit photo moderation permission: %s",async consent=>{
 const original=global.fetch;
 const fetchMock=jest.fn().mockResolvedValueOnce({ok:true,status:200,json:async()=>({uploadRequired:false})}).mockResolvedValueOnce({ok:true,status:202});
 global.fetch=fetchMock;
 try {
  const gateway=new HttpExperienceGateway({baseUrl:"https://api.test",getAccessToken:async()=>"token"});
  await gateway.uploadMedia({commandId:"cmd",experienceId:"e",mediaId:"m",image:{localUri:"file:///photo.jpg",contentType:"image/jpeg",size:123,moderationConsent:consent},at:"2026-10-08T00:00:00Z"});
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).moderationConsent).toBe(consent===true);
 } finally {global.fetch=original;}
});
