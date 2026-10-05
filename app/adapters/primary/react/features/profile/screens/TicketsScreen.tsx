import { ProfileLayout } from "../components/ProfileLayout";
import { TicketsContent } from "../components/TicketsContent";
import { useTicketsHistory } from "@/app/adapters/secondary/viewModel/useTicketsHistory";

export function TicketsScreen() {
    const vm = useTicketsHistory();
    return <ProfileLayout refreshing={vm.isRefreshing} onRefresh={vm.refresh}><TicketsContent vm={vm} /></ProfileLayout>;
}
export default TicketsScreen;
