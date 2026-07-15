import type { SavedCoffeeItem } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";
import { CommandId, commandKinds, ISODate } from "./outbox.type";

export type SavedCoffeeSetCommand = {
	kind: typeof commandKinds.SavedCoffeeSet;
	commandId: CommandId | string;
	savedCoffeeId: string;
	coffeeId: string;
	value: boolean;
	at: ISODate | string;
};

export type SavedCoffeeSetUndo = {
	kind: typeof commandKinds.SavedCoffeeSet;
	coffeeId: string;
	prevSaved: boolean;
	prevItem?: SavedCoffeeItem;
};
