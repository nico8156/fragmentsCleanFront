import {HomeCategoryVM} from "@/app/adapters/secondary/viewModel/useArticlesHome";

const bresil = require("@/assets/images/coffeePacks/paquet1.png")
const ethiopia = require("@/assets/images/coffeePacks/paquet2.png")
const guatemala = require("@/assets/images/coffeePacks/paquet3.png")
const colombia = require("@/assets/images/coffeePacks/paquet4.png")
const kenya = require("@/assets/images/coffeePacks/paquet5.png")
const rwanda = require("@/assets/images/coffeePacks/paquet6.png")
const coffeePacks = [
    {
        id: "brasil-velours-brunch",
        name: "Brunch Velours du Brésil",
        slug: "brasil-velours-brunch",
        image:{
            url:bresil,
            width: 100,
            height: 100,
        }
    },
    {
        id: "ethiopia-aube-florale",
        name: "Aube Florale d'Éthiopie",
        slug: "ethiopia-aube-florale",
        image:{
            url:ethiopia,
            width: 100,
            height: 100,
        }

    },
    {
        id: "guatemala-volcan-de-miel",
        name: "Volcan de Miel du Guatemala",
        slug: "guatemala-volcan-de-miel",
        image:{
            url:guatemala,
            width: 100,
            height: 100,
        }
    },
    {
        id: "colombia-niebla-de-sierra",
        name: "Niebla de Sierra – Colombie",
        slug: "colombia-niebla-de-sierra",
        image:{
            url:colombia,
            width: 100,
            height: 100,
        }
    },
    {
        id: "kenya-citrus-highlands",
        name: "Citrus Highlands du Kenya",
        slug: "kenya-citrus-highlands",
        image:{
            url:kenya,
            width: 100,
            height: 100,
        }
    },
    {
        id: "rwanda-blue-hills",
        name: "Blue Hills du Rwanda",
        slug: "rwanda-blue-hills",
        image:{
            url:rwanda,
            width: 100,
            height: 100,
        }
    },
];
export const dataForPacks: HomeCategoryVM[] = [{
    id:"pack-coffee-data",
    title:"Des cafés à déguster...",
    subtitle:"Nous les avons trouvé pour vous !",
    items:coffeePacks
}]
