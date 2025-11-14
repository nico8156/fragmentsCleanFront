import { TicketLineItem } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import { onTicketConfirmedAck, onTicketRejectedAck } from "@/app/core-logic/contextWL/ticketWl/usecases/read/ackTicket";
import {parseToCommandId} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";

const TOTAL_KEYWORDS = /(total|montant|à payer|a payer|ttc|payé|paye)/i;
const BLOCKED_LINE_ITEM_KEYWORDS = /(total|tva|taxe|paiement|merci|remerciements|carte|cb|visa|master|amex|contact)/i;
const ADDRESS_KEYWORDS = /(rue|avenue|av\.?|bd\.?|boulevard|place|pl\.?|chemin|impasse|allee|allée)/i;
const PAYMENT_KEYWORDS: Record<string, RegExp> = {
    "CB": /(carte bancaire|cb|cb sans contact)/i,
    "VISA": /visa/i,
    "MASTERCARD": /mastercard/i,
    "AMEX": /american express|amex/i,
    "ESPECES": /(espèces|especes|cash)/i,
};

const randomAckDelayMs = () => 1500 + Math.floor(Math.random() * 2000);

const parseAmount = (line: string) => {
    const match = line.match(/(\d+[.,]\d{2})/);
    if (!match) return null;
    const normalized = match[1].replace(",", ".");
    const value = Number.parseFloat(normalized);
    if (Number.isNaN(value)) return null;
    return Math.round(value * 100);
};

const inferCurrency = (segment: string | undefined) => {
    if (!segment) return "EUR";
    if (/usd/i.test(segment)) return "USD";
    if (/chf/i.test(segment)) return "CHF";
    return "EUR";
};

const extractAmount = (lines: string[]) => {
    for (const line of lines) {
        if (!TOTAL_KEYWORDS.test(line)) continue;
        const cents = parseAmount(line);
        if (cents !== null) {
            const currency = inferCurrency(line);
            return { cents, currency } as const;
        }
    }

    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const cents = parseAmount(lines[i]);
        if (cents !== null) {
            return { cents, currency: inferCurrency(lines[i]) } as const;
        }
    }
    return null;
};

const toIsoDate = (raw: string, fallback: string) => {
    const clean = raw.replace(/(\.|\/|\-)/g, "-");
    let isoCandidate: string | null = null;
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
        isoCandidate = clean;
    } else {
        const [, d, m, y] = clean.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/) ?? [];
        if (d && m && y) {
            const year = Number(y.length === 2 ? `20${y}` : y);
            const month = String(m).padStart(2, "0");
            const day = String(d).padStart(2, "0");
            isoCandidate = `${year}-${month}-${day}`;
        }
    }
    const date = isoCandidate ? new Date(`${isoCandidate}T12:00:00.000Z`) : new Date(fallback);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }
    return date.toISOString();
};

const extractDate = (text: string, fallback: string) => {
    const match = text.match(/(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/);
    if (!match) return fallback;
    return toIsoDate(match[1], fallback);
};

const extractMerchantName = (lines: string[]) => {
    return (
        lines.find((line) => line.length > 2 && /[a-z]/i.test(line) && !TOTAL_KEYWORDS.test(line)) ??
        "Ticket scanné"
    );
};

const extractAddress = (lines: string[]) =>
    lines.find((line) => /\d{2,}/.test(line) && ADDRESS_KEYWORDS.test(line)) ?? undefined;

const extractPaymentMethod = (text: string) => {
    for (const [label, regex] of Object.entries(PAYMENT_KEYWORDS)) {
        if (regex.test(text)) {
            return label;
        }
    }
    if (/sans contact/i.test(text)) {
        return "Sans contact";
    }
    return undefined;
};

const extractLineItems = (lines: string[]): TicketLineItem[] | undefined => {
    const items: TicketLineItem[] = [];
    lines.forEach((line) => {
        if (BLOCKED_LINE_ITEM_KEYWORDS.test(line)) return;
        const match = line.match(/(.+?)\s{1,}(\d+(?:[.,]\d{2}))/);
        if (!match) return;
        const [, rawLabel, rawAmount] = match;
        const trimmedLabel = rawLabel.replace(/\s{2,}/g, " ").trim();
        if (!trimmedLabel || /\b(x|\d{3,})$/i.test(trimmedLabel)) return;
        const qtyMatch = trimmedLabel.match(/^(\d+)x\s*(.+)$/i);
        const quantity = qtyMatch ? Number.parseInt(qtyMatch[1], 10) : undefined;
        const label = qtyMatch ? qtyMatch[2] : trimmedLabel;
        const amountCents = parseAmount(rawAmount);
        items.push({ label, quantity, amountCents: amountCents ?? undefined });
    });
    return items.length ? items.slice(0, 5) : undefined;
};

const normalizeLines = (text: string) =>
    text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

type AckDispatcher = (action: { type: string; payload?: any }) => void;

type ParseSuccess = {
    ok: true;
    amountCents: number;
    currency: string;
    ticketDate: string;
    merchantName?: string;
    merchantAddress?: string;
    paymentMethod?: string;
    lineItems?: TicketLineItem[];
};

type ParseFailure = { ok: false; reason: string };

const parseTicket = (ocrText: string | null | undefined, fallbackDate: string): ParseSuccess | ParseFailure => {
    if (!ocrText || !ocrText.trim()) {
        return { ok: false, reason: "Ticket illisible" };
    }
    const normalizedText = ocrText.replace(/ +/g, " ");
    const lines = normalizeLines(normalizedText);
    if (!lines.length) {
        return { ok: false, reason: "Aucune donnée exploitable" };
    }
    const amount = extractAmount(lines);
    if (!amount) {
        return { ok: false, reason: "Montant introuvable" };
    }
    const ticketDate = extractDate(normalizedText, fallbackDate);
    return {
        ok: true,
        amountCents: amount.cents,
        currency: amount.currency,
        ticketDate,
        merchantName: extractMerchantName(lines),
        merchantAddress: extractAddress(lines),
        paymentMethod: extractPaymentMethod(normalizedText),
        lineItems: extractLineItems(lines),
    };
};

export class FakeTicketsGateway {
    willFailVerify = false;

    private ackDispatcher?: AckDispatcher;

    private currentUserIdGetter?: () => string;

    setAckDispatcher(dispatcher: AckDispatcher) {
        this.ackDispatcher = dispatcher;
    }

    setCurrentUserIdGetter(getter: () => string) {
        this.currentUserIdGetter = getter;
    }

    private getCurrentUserId() {
        return this.currentUserIdGetter?.() ?? "anonymous";
    }

    private dispatchAck(action: { type: string; payload?: any }) {
        if (this.ackDispatcher) {
            this.ackDispatcher(action);
        }
    }

    async verify({
        commandId,
        ticketId,
        imageRef,
        ocrText,
        at,
    }: {
        commandId: string;
        ticketId?: string;
        imageRef?: string;
        ocrText?: string | null;
        at: string;
    }) {
        void imageRef;
        if (this.willFailVerify) throw new Error("ticket verify failed");

        const parsed = parseTicket(ocrText, at);
        const delay = randomAckDelayMs();
        setTimeout(() => {
            const id = ticketId ?? `tk_${commandId}`;
            const userId = this.getCurrentUserId();
            if (parsed.ok) {
                this.dispatchAck(
                    onTicketConfirmedAck({
                        commandId: parseToCommandId(commandId),
                        ticketId: id as any,
                        userId,
                        server: {
                            status: "CONFIRMED",
                            version: 1,
                            amountCents: parsed.amountCents,
                            currency: parsed.currency,
                            ticketDate: parsed.ticketDate as any,
                            updatedAt: new Date().toISOString() as any,
                            merchantName: parsed.merchantName,
                            merchantAddress: parsed.merchantAddress,
                            paymentMethod: parsed.paymentMethod,
                            lineItems: parsed.lineItems,
                        },
                    }),
                );
            } else {
                this.dispatchAck(
                    onTicketRejectedAck({
                        commandId: parseToCommandId(commandId),
                        ticketId: id as any,
                        userId,
                        server: {
                            status: "REJECTED",
                            reason: parsed.reason,
                            version: 1,
                            updatedAt: new Date().toISOString() as any,
                            merchantName: undefined,
                            merchantAddress: undefined,
                        },
                    }),
                );
            }
        }, delay);
    }
}

// Petit helper async, identique à tes likes
export const flush = () => new Promise<void>((r) => setTimeout(r, 0));
