import {Article, ArticleId, ImageRef, Slug, UserId} from "@/app/contextWL/articleWl/typeAction/article.type";
import {ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";

const toArticleId = (value: string) => value as ArticleId;
const toSlug = (value: string) => value as Slug;
const toUserId = (value: string) => value as UserId;
const toISODate = (value: string) => value as ISODate;

const ensureImage = (image: ImageRef): ImageRef => image;

export const specialtyArticles: Article[] = [
    {
        id: toArticleId("article-001"),
        slug: toSlug("quest-ce-que-le-cafe-de-specialite"),
        locale: "fr-FR",
        title: "Qu'est-ce que le café de spécialité ?",
        intro: "Comprendre le café de spécialité, c'est plonger dans une filière où la qualité prime à chaque étape, du terroir à la tasse.",
        blocks: [
            {
                heading: "Une histoire de terroir",
                paragraph:
                    "Chaque café de spécialité commence par un terroir unique. L'altitude, le climat et la composition des sols confèrent des arômes singuliers aux cerises mûries lentement.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1470583190240-bcaa01721dbb?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Plantation de café verdoyante sous le soleil.",
                }),
            },
            {
                heading: "Des standards de qualité stricts",
                paragraph:
                    "Les lots sont évalués par des Q-graders, des experts capables d'identifier les défauts et de noter les qualités organoleptiques. Seuls les cafés dépassant 80/100 obtiennent la mention 'spécialité'.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Expert en train de déguster plusieurs tasses de café.",
                }),
            },
            {
                heading: "Une expérience sensorielle unique",
                paragraph:
                    "La torréfaction légère révèle la diversité aromatique : notes florales, fruitées ou chocolatées. C'est cette palette qui fait vibrer les amateurs de cafés fins.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1000,
                    alt: "Tasse de café fumante posée sur une table en bois.",
                }),
            },
        ],
        conclusion:
            "Le café de spécialité n'est pas un simple produit : c'est l'aboutissement d'une chaîne de passionnés qui valorisent la qualité, la traçabilité et la durabilité.",
        cover: ensureImage({
            url: "https://images.unsplash.com/photo-1470583190240-bcaa01721dbb?auto=format&fit=crop&w=1600&q=80",
            width: 1600,
            height: 1067,
            alt: "Branches de caféier chargées de cerises rouges.",
        }),
        tags: ["Origines", "Qualité", "Terroir"],
        author: { id: toUserId("author-helene-martin"), name: "Hélène Martin" },
        readingTimeMin: 6,
        publishedAt: toISODate("2024-02-14T08:00:00.000Z"),
        updatedAt: toISODate("2024-03-02T09:30:00.000Z"),
        version: 1,
        status: "published",
        coffeeIds: [],
    },
    {
        id: toArticleId("article-002"),
        slug: toSlug("le-cafe-est-il-bon-pour-la-sante"),
        locale: "fr-FR",
        title: "Le café est-il bon pour la santé ?",
        intro: "Longtemps controversé, le café révèle aujourd'hui de nombreuses vertus pourvu que l'on reste à l'écoute de son corps.",
        blocks: [
            {
                heading: "Un coup de pouce énergétique maîtrisé",
                paragraph:
                    "La caféine stimule le système nerveux et améliore la concentration. Une consommation modérée, répartie dans la journée, aide à rester alerte sans provoquer de nervosité.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1000,
                    alt: "Main tenant une tasse de café au-dessus d'un carnet.",
                }),
            },
            {
                heading: "Des antioxydants précieux",
                paragraph:
                    "Les polyphénols présents dans le café contribuent à lutter contre le stress oxydatif. Ils accompagnent le bon fonctionnement du cœur et du métabolisme.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1523942839745-7848d4b29468?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1000,
                    alt: "Grains de café fraîchement torréfiés dans un sac en toile.",
                }),
            },
            {
                heading: "Écouter ses besoins",
                paragraph:
                    "Chaque organisme réagit différemment. Opter pour des cafés filtrés, hydratés et consommés avant la fin de l'après-midi permet de profiter des bienfaits sans perturber le sommeil.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Moment détente avec une tasse de café et un plaid.",
                }),
            },
        ],
        conclusion:
            "Le café peut devenir un allié bien-être s'il est choisi avec soin et savouré en conscience. La qualité des grains et la manière de les préparer font toute la différence.",
        cover: ensureImage({
            url: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=1600&q=80",
            width: 1600,
            height: 1000,
            alt: "Tasse de café posée sur un bureau lumineux.",
        }),
        tags: ["Bien-être", "Nutrition", "Science"],
        author: { id: toUserId("author-leo-bernard"), name: "Léo Bernard" },
        readingTimeMin: 5,
        publishedAt: toISODate("2024-03-05T07:20:00.000Z"),
        updatedAt: toISODate("2024-03-18T16:45:00.000Z"),
        version: 1,
        status: "published",
        coffeeIds: [],
    },
    {
        id: toArticleId("article-003"),
        slug: toSlug("comment-est-cultive-le-cafe"),
        locale: "fr-FR",
        title: "Comment est cultivé le café ?",
        intro: "Découvrir la culture du café, c'est partir à la rencontre des producteurs qui façonnent les arômes grain après grain.",
        blocks: [
            {
                heading: "Du semis à la floraison",
                paragraph:
                    "Les caféiers poussent à l'ombre d'arbres protecteurs pendant plusieurs années. Les fleurs blanches, éphémères, laissent place aux cerises qui mûrissent lentement.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Fleurs blanches d'un caféier sous la rosée.",
                }),
            },
            {
                heading: "Une récolte méticuleuse",
                paragraph:
                    "Les cueilleurs sélectionnent uniquement les cerises à maturité optimale. Ce tri manuel garantit une uniformité indispensable aux cafés de spécialité.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Cueilleur récoltant des cerises de café à la main.",
                }),
            },
            {
                heading: "Des méthodes de traitement variées",
                paragraph:
                    "Lavé, nature ou honey : chaque méthode influe sur le profil aromatique. Les producteurs adaptent les procédés pour révéler le potentiel du terroir.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1535480424501-7711c98712c9?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Grains de café en cours de séchage au soleil.",
                }),
            },
        ],
        conclusion:
            "De la graine à la tasse, la culture du café est une aventure collective où chaque geste compte. Respecter ce travail, c'est valoriser les producteurs et la planète.",
        cover: ensureImage({
            url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80",
            width: 1600,
            height: 1067,
            alt: "Plant de café avec cerises rouges et feuilles brillantes.",
        }),
        tags: ["Culture", "Durabilité", "Producteurs"],
        author: { id: toUserId("author-samia-costa"), name: "Samia Costa" },
        readingTimeMin: 7,
        publishedAt: toISODate("2024-04-12T09:00:00.000Z"),
        updatedAt: toISODate("2024-04-20T11:15:00.000Z"),
        version: 1,
        status: "published",
        coffeeIds: [],
    },
    {
        id: toArticleId("article-004"),
        slug: toSlug("comment-preparer-un-bon-cafe-a-la-maison"),
        locale: "fr-FR",
        title: "Comment préparer un bon café à la maison",
        intro: "Avec quelques astuces, chaque tasse à la maison peut rivaliser avec votre coffee shop préféré.",
        blocks: [
            {
                heading: "Choisir le bon moulin",
                paragraph:
                    "La fraîcheur du grain est primordiale. Un moulin à meules coniques vous garantit une mouture régulière adaptée à votre méthode d'extraction.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Moulin à café manuel posé sur un plan de travail.",
                }),
            },
            {
                heading: "Maîtriser la recette",
                paragraph:
                    "Dosez 60 g de café par litre d'eau filtrée et ajustez selon vos goûts. Un chronomètre vous aide à reproduire l'extraction idéale.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Préparation d'un café filtre avec une balance et un chronomètre.",
                }),
            },
            {
                heading: "Soigner le service",
                paragraph:
                    "Préchauffez vos tasses et remuez la cafetière avant de servir pour harmoniser les arômes. Un détail qui change tout !",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Deux tasses de café servies sur un plateau en bois.",
                }),
            },
        ],
        conclusion:
            "Prendre le temps de bien faire, c'est s'offrir un rituel quotidien. Chaque geste intentionnel révèle une nouvelle nuance dans votre tasse.",
        cover: ensureImage({
            url: "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1600&q=80",
            width: 1600,
            height: 1067,
            alt: "Barista versant un café filtre dans une tasse.",
        }),
        tags: ["Maison", "Recettes", "Équipement"],
        author: { id: toUserId("author-ines-dupont"), name: "Inès Dupont" },
        readingTimeMin: 4,
        publishedAt: toISODate("2024-04-25T06:45:00.000Z"),
        updatedAt: toISODate("2024-04-28T18:05:00.000Z"),
        version: 1,
        status: "published",
        coffeeIds: [],
    },
    {
        id: toArticleId("article-005"),
        slug: toSlug("comment-decouvrir-et-choisir-son-cafe"),
        locale: "fr-FR",
        title: "Comment découvrir et choisir son café",
        intro: "Identifier ses préférences gustatives ouvre la porte à des découvertes infinies dans l'univers du café.",
        blocks: [
            {
                heading: "Comprendre ses goûts",
                paragraph:
                    "Commencez par définir vos sensations favorites : acidité vive, douceur chocolatée, longueur épicée… Tenez un carnet de dégustation pour mémoriser vos coups de cœur.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1523365280197-f1783db9fe62?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Carnet de notes à côté d'une tasse de café.",
                }),
            },
            {
                heading: "Explorer les origines",
                paragraph:
                    "Éthiopie, Colombie, Guatemala… Chaque origine possède une identité. Testez des torréfacteurs artisanaux pour voyager tasse après tasse.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1515446134809-993c501ca304?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1000,
                    alt: "Cartes et sachets de café de différentes origines.",
                }),
            },
            {
                heading: "S'appuyer sur la communauté",
                paragraph:
                    "Participez à des cuppings, échangez avec des baristas et utilisez l'application Fragments pour noter vos découvertes et débloquer des privilèges.",
                photo: ensureImage({
                    url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1600&q=80",
                    width: 1600,
                    height: 1067,
                    alt: "Groupe de personnes dégustant du café autour d'une table.",
                }),
            },
        ],
        conclusion:
            "En cultivant votre curiosité, vous bâtissez une cartographie gustative personnelle. Chaque tasse devient une aventure, partagée avec la communauté Fragments !",
        cover: ensureImage({
            url: "https://images.unsplash.com/photo-1523365280197-f1783db9fe62?auto=format&fit=crop&w=1600&q=80",
            width: 1600,
            height: 1067,
            alt: "Carnet de dégustation de café rempli de notes.",
        }),
        tags: ["Découverte", "Torréfacteurs", "Communauté"],
        author: { id: toUserId("author-jules-moreau"), name: "Jules Moreau" },
        readingTimeMin: 6,
        publishedAt: toISODate("2024-05-02T10:10:00.000Z"),
        updatedAt: toISODate("2024-05-05T14:20:00.000Z"),
        version: 1,
        status: "published",
        coffeeIds: [],
    },
];
