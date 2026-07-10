import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";

import type { ArticleBlock, ImageRef, Locale } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { submitStudioArticle, uploadStudioArticleImage } from "@/app/core-logic/contextWL/studioWl/usecases/studioArticleUseCases";

const blankBlock = (): ArticleBlock => ({
	heading: "",
	paragraph: "",
});

const slugify = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

export function useStudioArticleEditor() {
	const dispatch = useDispatch<any>();
	const state = useSelector((s: RootStateWl) => s.stState);
	const session = useSelector((s: RootStateWl) => s.aState.session);
	const profile = useSelector((s: RootStateWl) => s.aState.currentUser);

	const [adminToken, setAdminToken] = useState("");
	const [assetArticleId] = useState(() => uuidv4());
	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [intro, setIntro] = useState("");
	const [conclusion, setConclusion] = useState("");
	const [tagsText, setTagsText] = useState("");
	const [coffeeIdsText, setCoffeeIdsText] = useState("");
	const [cover, setCover] = useState<ImageRef | undefined>();
	const [blocks, setBlocks] = useState<ArticleBlock[]>([blankBlock()]);

	const effectiveSlug = slug.trim() || slugify(title);
	const authorId = session?.userId ?? "00000000-0000-0000-0000-000000000000";
	const authorName = profile?.displayName ?? "Fragments Studio";

	const canSubmit = Boolean(adminToken.trim() && title.trim() && effectiveSlug && intro.trim() && conclusion.trim());

	const updateBlock = (index: number, patch: Partial<ArticleBlock>) => {
		setBlocks((items) => items.map((block, i) => (i === index ? { ...block, ...patch } : block)));
	};

	const addBlock = () => setBlocks((items) => [...items, blankBlock()]);
	const removeBlock = (index: number) => setBlocks((items) => items.filter((_, i) => i !== index));

	const pickAndUploadImage = async (target: { kind: "cover" } | { kind: "block"; index: number }) => {
		if (!adminToken.trim()) return;
		const picked = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: false,
			quality: 0.9,
		});
		if (picked.canceled || !picked.assets[0]) return;
		const asset = picked.assets[0];
		const name = asset.fileName ?? `article-image-${Date.now()}.jpg`;
		const type = asset.mimeType ?? "image/jpeg";
		await dispatch(uploadStudioArticleImage({
			articleId: assetArticleId,
			uri: asset.uri,
			name,
			type,
			alt: target.kind === "cover" ? title : blocks[target.index]?.heading,
			adminToken: adminToken.trim(),
		}));
	};

	const applyLastUploadedAsCover = () => {
		if (state.imageUpload.lastImage) setCover(state.imageUpload.lastImage);
	};

	const applyLastUploadedToBlock = (index: number) => {
		if (state.imageUpload.lastImage) updateBlock(index, { photo: state.imageUpload.lastImage });
	};

	const submit = () => {
		if (!canSubmit) return;
		const tags = tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
		const coffeeIds = coffeeIdsText.split(",").map((id) => id.trim()).filter(Boolean);
		dispatch(submitStudioArticle({
			adminToken: adminToken.trim(),
			draft: {
				slug: effectiveSlug,
				locale: "fr-FR" as Locale,
				authorId,
				authorName,
				title: title.trim(),
				intro: intro.trim(),
				blocks: blocks.filter((block) => block.heading.trim() || block.paragraph.trim()),
				conclusion: conclusion.trim(),
				cover,
				tags,
				coffeeIds,
			},
		}));
	};

	return useMemo(() => ({
		adminToken,
		setAdminToken,
		title,
		setTitle,
		slug,
		setSlug,
		effectiveSlug,
		intro,
		setIntro,
		conclusion,
		setConclusion,
		tagsText,
		setTagsText,
		coffeeIdsText,
		setCoffeeIdsText,
		cover,
		blocks,
		updateBlock,
		addBlock,
		removeBlock,
		pickAndUploadImage,
		applyLastUploadedAsCover,
		applyLastUploadedToBlock,
		submit,
		canSubmit,
		status: state.articleSubmit.status,
		commandStatus: state.articleSubmit.commandStatus,
		error: state.articleSubmit.error ?? state.imageUpload.error,
		lastSubmitted: state.articleSubmit.lastSubmitted,
		lastImage: state.imageUpload.lastImage,
		isUploadingImage: state.imageUpload.status === "pending",
		isSubmitting: state.articleSubmit.status === "pending",
	}), [adminToken, title, slug, effectiveSlug, intro, conclusion, tagsText, coffeeIdsText, cover, blocks, state]);
}
