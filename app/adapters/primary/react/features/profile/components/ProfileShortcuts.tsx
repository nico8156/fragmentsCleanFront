import { ProfileMenuList, type ProfileMenuItem } from "./ProfileMenuList";
import type { ProfileStackParamList } from "@/app/adapters/primary/react/navigation/types";

type ProfileMenuDestination = Exclude<keyof ProfileStackParamList, "ProfileHome">;

const MENU_ITEMS: ProfileMenuItem<ProfileMenuDestination>[] = [
	{ symbolName: "cup.and.saucer.fill", title: "Mes expériences", destination: "Experiences" },
	{ symbolName: "heart.fill", title: "Cafés favoris", destination: "Favorites" },
	{ symbolName: "list.bullet.rectangle.portrait", title: "Mes tickets", destination: "Tickets" },
	{ symbolName: "dial.low", title: "Compte et réglages", destination: "AppSettings" },
];

export function ProfileShortcuts({ onNavigate }: { onNavigate: (destination: ProfileMenuDestination) => void }) {
	return <ProfileMenuList items={MENU_ITEMS} onNavigate={onNavigate} />;
}
