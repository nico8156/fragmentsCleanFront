import {CommentsStateWl} from "@/app/contextWL/commentWl/commentWl.type";

export interface AppStateWl {
    comments:CommentsStateWl
}

export interface DependenciesWl {
    gateways: any;
    helpers: {
        nowIso: () => string;
        currentUserId: () => string;
        getIdForTests: () => "cmt_tmp_Yffc7N3rOvXUYWMCLZnGT";
    }

}

