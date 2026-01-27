import "react-native-get-random-values";

import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { FakeCfPhotoWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeCfPhotoWlGateway";
import { FakeCoffeeGateway } from "@/app/adapters/secondary/gateways/fake/fakeCoffeeWlGateway";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";
import { FakeOpeningHoursWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";

import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { outboxStorage } from "./runtimeDeps";

import { StaticArticleWlGateway } from "@/app/adapters/secondary/gateways/articles/staticArticleWlGateway";
import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";

import { authServerGateway } from "@/app/adapters/secondary/gateways/auth/authServerGateway";
import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { googleOAuthGateway } from "@/app/adapters/secondary/gateways/auth/googleOAuthGateway";
import { HttpUserRepo } from "@/app/adapters/secondary/gateways/user/HttpUserRepo";

import { HttpCommentsGateway } from "@/app/adapters/secondary/gateways/comments/HttpCommentsGateway";
import { HttpLikesGateway } from "@/app/adapters/secondary/gateways/like/HttpLikesGateway";
import { HttpCommandStatusGateway } from "@/app/adapters/secondary/gateways/outbox/HttpCommandStatusGateway";
import { HttpTicketsGateway } from "@/app/adapters/secondary/gateways/ticket/HttpTicketsGateway";

import { WsStompEventsGateway } from "@/app/adapters/primary/socket/WsEventsGateway";
import type { GatewaysWl } from "./types";

export const createInfrastructure = (apiBaseUrl: string) => {
	const authToken = new AuthTokenBridge();
	const sessionRef: { current?: AuthSession } = { current: undefined };

	const onSessionChanged = (session: AuthSession | undefined) => {
		authToken.setSession(session);
		sessionRef.current = session;
	};

	const gateways: GatewaysWl = {
		coffees: new FakeCoffeeGateway(),
		cfPhotos: new FakeCfPhotoWlGateway(),
		openingHours: new FakeOpeningHoursWlGateway(),

		comments: new HttpCommentsGateway({
			baseUrl: apiBaseUrl,
			getAccessToken: authToken.getAccessToken,
		}),

		likes: new HttpLikesGateway({
			baseUrl: apiBaseUrl,
			authToken,
		}),

		tickets: new HttpTicketsGateway({
			baseUrl: apiBaseUrl,
			auth: authToken,
		}),

		commandStatus: new HttpCommandStatusGateway({
			baseUrl: apiBaseUrl,
			authToken,
		}),

		entitlements: new FakeEntitlementWlGateway(),
		locations: new ExpoLocationGateway(),
		articles: new StaticArticleWlGateway(),

		ws: new WsStompEventsGateway(),

		authToken: authToken,

		auth: {
			oauth: googleOAuthGateway,
			secureStore: new ExpoSecureAuthSessionStore(),
			userRepo: new HttpUserRepo({
				baseUrl: apiBaseUrl,
				getAccessToken: authToken.getAccessToken,
			}),
			server: authServerGateway,
		},
	};


	return { gateways, outboxStorage, onSessionChanged, sessionRef };
};
