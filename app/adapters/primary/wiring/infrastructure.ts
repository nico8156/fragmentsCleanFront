import "react-native-get-random-values";

import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { FakeEntitlementWlGateway } from "@/app/adapters/secondary/gateways/fake/fakeEntitlementWlGateway";

import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { outboxStorage } from "./runtimeDeps";

import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";

import { createAuthServerGateway } from "@/app/adapters/secondary/gateways/auth/authServerGateway";
import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { googleOAuthGateway } from "@/app/adapters/secondary/gateways/auth/googleOAuthGateway";

import { HttpCommentsGateway } from "@/app/adapters/secondary/gateways/comments/HttpCommentsGateway";
import { HttpLikesGateway } from "@/app/adapters/secondary/gateways/like/HttpLikesGateway";
import { HttpCommandStatusGateway } from "@/app/adapters/secondary/gateways/outbox/HttpCommandStatusGateway";
import { HttpTicketsGateway } from "@/app/adapters/secondary/gateways/ticket/HttpTicketsGateway";
import { HttpUserRepo } from "@/app/adapters/secondary/gateways/user/HttpUserRepo";

import { HttpArticleWlGateway } from "../../secondary/gateways/articles/HttpArticleWlGateway";
import { HttpCfPhotoGateway } from "../../secondary/gateways/coffee/HttpCfPhotoGateway";
import { HttpCoffeeGateway } from "../../secondary/gateways/coffee/HttpCoffeeGateway";
import { HttpOpeningHoursGateway } from "../../secondary/gateways/coffee/HttpOpeningHoursGateway";

import { WsStompEventsGateway } from "@/app/adapters/primary/socket/WsEventsGateway";
import type { GatewaysWl } from "./types";
import { HttpProjectionSyncGateway } from "@/app/adapters/secondary/gateways/projectionSync/HttpProjectionSyncGateway";
import { PROJECTION_SYNC_EVENTS_PATH } from "./config";

// ✅ NOTE: on ne dépend plus de API_BASE_URL ici.
// La source de vérité devient "apiBaseUrl" passé en argument.

export const createInfrastructure = (apiBaseUrl: string) => {
	// normalise une seule fois
	const baseUrl = (apiBaseUrl ?? "").trim().replace(/\/+$/, "");
	if (!baseUrl) {
		throw new Error("[createInfrastructure] apiBaseUrl is empty/undefined");
	}

	const authToken = new AuthTokenBridge();
	const sessionRef: { current?: AuthSession } = { current: undefined };

	const onSessionChanged = (session: AuthSession | undefined) => {
		authToken.setSession(session);
		sessionRef.current = session;
	};

	const gateways: GatewaysWl = {
		// ✅ aligné sur baseUrl unique
		coffees: new HttpCoffeeGateway({ baseUrl }),
		cfPhotos: new HttpCfPhotoGateway({ baseUrl }),
		openingHours: new HttpOpeningHoursGateway({ baseUrl }),

		comments: new HttpCommentsGateway({
			baseUrl,
			getAccessToken: authToken.getAccessToken,
		}),

		likes: new HttpLikesGateway({
			baseUrl,
			authToken,
		}),

		tickets: new HttpTicketsGateway({
			baseUrl,
			auth: authToken,
		}),

		commandStatus: new HttpCommandStatusGateway({
			baseUrl,
			authToken,
		}),

		entitlements: new FakeEntitlementWlGateway(),
		locations: new ExpoLocationGateway(),

		articles: new HttpArticleWlGateway({ baseUrl }),

		ws: new WsStompEventsGateway(),

		projectionSync: new HttpProjectionSyncGateway({
			baseUrl,
			eventsPath: PROJECTION_SYNC_EVENTS_PATH,
		}),

		authToken,

		auth: {
			oauth: googleOAuthGateway,
			secureStore: new ExpoSecureAuthSessionStore(),

			// ✅ hydrate user via le même host/port que le reste
			userRepo: new HttpUserRepo({
				baseUrl,
				getAccessToken: authToken.getAccessToken,
			}),

			server: createAuthServerGateway({ baseUrl }),
		},
	};

	return { gateways, outboxStorage, onSessionChanged, sessionRef };
};
