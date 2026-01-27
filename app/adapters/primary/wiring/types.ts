// app/adapters/primary/wiring/types.ts

import type { CfPhotoGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import type { CoffeeWlGateway } from "@/app/core-logic/contextWL/coffeeWl/gateway/coffeeWl.gateway";
import type { OpeningHoursGateway } from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";

import type { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import type { LikeWlGateway } from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";
import type { TicketsWlGateway } from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";

import type { ArticleWlGateway } from "@/app/core-logic/contextWL/articleWl/gateway/articleWl.gateway";
import type { EntitlementWlGateway } from "@/app/core-logic/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import type { LocationWlGateway } from "@/app/core-logic/contextWL/locationWl/gateway/location.gateway";

import type {
	AuthSecureStore,
	AuthServerGateway,
	OAuthGateway,
	UserRepo,
} from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";

import type { CommandStatusGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/commandStatus.gateway";

import type { WsEventsGatewayPort } from "@/app/adapters/primary/socket/ws.gateway";
import type { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";

export type GatewaysWl = {
	coffees: CoffeeWlGateway;
	cfPhotos: CfPhotoGateway;
	openingHours: OpeningHoursGateway;

	comments: CommentsWlGateway;
	likes: LikeWlGateway;
	tickets: TicketsWlGateway;

	entitlements: EntitlementWlGateway;
	locations: LocationWlGateway;
	articles: ArticleWlGateway;

	auth: {
		oauth: OAuthGateway;
		secureStore: AuthSecureStore;
		userRepo: UserRepo;
		server?: AuthServerGateway;
	};

	ws: WsEventsGatewayPort;
	authToken: AuthTokenBridge;
	commandStatus: CommandStatusGateway;
};
