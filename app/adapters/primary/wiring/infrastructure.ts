import "react-native-get-random-values";

import { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";

import type { AuthSession } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { outboxStorage } from "./runtimeDeps";

import { ExpoLocationGateway } from "@/app/adapters/secondary/gateways/locationGateway/expoLocationGateway";

import { createAuthServerGateway } from "@/app/adapters/secondary/gateways/auth/authServerGateway";
import { ExpoSecureAuthSessionStore } from "@/app/adapters/secondary/gateways/auth/expoSecureAuthSessionStore";
import { providerOAuthGateway } from "@/app/adapters/secondary/gateways/auth/providerOAuthGateway";

import { HttpCommentsGateway } from "@/app/adapters/secondary/gateways/comments/HttpCommentsGateway";
import { HttpEntitlementWlGateway } from "@/app/adapters/secondary/gateways/entitlement/HttpEntitlementWlGateway";
import { HttpLikesGateway } from "@/app/adapters/secondary/gateways/like/HttpLikesGateway";
import { HttpSavedCoffeeGateway } from "@/app/adapters/secondary/gateways/savedCoffee/HttpSavedCoffeeGateway";
import { HttpCommandStatusGateway } from "@/app/adapters/secondary/gateways/outbox/HttpCommandStatusGateway";
import { HttpTicketsGateway } from "@/app/adapters/secondary/gateways/ticket/HttpTicketsGateway";
import { HttpUserRepo } from "@/app/adapters/secondary/gateways/user/HttpUserRepo";

import { HttpArticleWlGateway } from "../../secondary/gateways/articles/HttpArticleWlGateway";
import { ExpoImageCacheGateway } from "../../secondary/gateways/coffee/ExpoImageCacheGateway";
import { HttpCfPhotoGateway } from "../../secondary/gateways/coffee/HttpCfPhotoGateway";
import { HttpCoffeeGateway } from "../../secondary/gateways/coffee/HttpCoffeeGateway";
import { HttpOpeningHoursGateway } from "../../secondary/gateways/coffee/HttpOpeningHoursGateway";

import type { GatewaysWl } from "./types";
import { HttpProjectionSyncGateway } from "@/app/adapters/secondary/gateways/projectionSync/HttpProjectionSyncGateway";
import { PROJECTION_SYNC_EVENTS_PATH } from "./config";
import { HttpExperienceGateway } from "@/app/adapters/secondary/gateways/experiences/HttpExperienceGateway";
import { expoLocalPrivateMediaGateway } from "@/app/adapters/secondary/gateways/media/ExpoLocalPrivateMediaGateway";

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

	const users = new HttpUserRepo({
		baseUrl,
		getAccessToken: authToken.getAccessToken,
	});

	const gateways: GatewaysWl = {
		// ✅ aligné sur baseUrl unique
		coffees: new HttpCoffeeGateway({ baseUrl }),
		cfPhotos: new HttpCfPhotoGateway({ baseUrl }),
		imageCache: new ExpoImageCacheGateway(),
		openingHours: new HttpOpeningHoursGateway({ baseUrl }),

		comments: new HttpCommentsGateway({
			baseUrl,
			getAccessToken: authToken.getAccessToken,
		}),
		experiences: new HttpExperienceGateway({ baseUrl, getAccessToken: authToken.getAccessToken }),

		likes: new HttpLikesGateway({
			baseUrl,
			authToken,
		}),

		savedCoffees: new HttpSavedCoffeeGateway({
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
		localPrivateMedia: expoLocalPrivateMediaGateway,

		entitlements: new HttpEntitlementWlGateway({
			baseUrl,
			authToken,
		}),
		locations: new ExpoLocationGateway(),

		articles: new HttpArticleWlGateway({ baseUrl }),
		users,

		projectionSync: new HttpProjectionSyncGateway({
			baseUrl,
			eventsPath: PROJECTION_SYNC_EVENTS_PATH,
		}),

		authToken,

		auth: {
			oauth: providerOAuthGateway,
			secureStore: new ExpoSecureAuthSessionStore(),

			// ✅ hydrate user via le même host/port que le reste
			userRepo: users,

			server: createAuthServerGateway({ baseUrl }),
		},
	};

	return { gateways, outboxStorage, onSessionChanged, sessionRef };
};
