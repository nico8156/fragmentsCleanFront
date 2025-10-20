// tests/testUtils/fakeTicketsGateway.ts
export class FakeTicketsGateway {
    willFailVerify = false;

    // Simule l’API write: on envoie la commande "verify" et on attend un ACK ailleurs
    async verify(_: {
        commandId: string;
        imageRef?: string;
        ocrText?: string | null;
        at: string;
    }) {
        if (this.willFailVerify) throw new Error("ticket verify failed");
    }
}

// Petit helper async, identique à tes likes
export const flush = () => new Promise<void>((r) => setTimeout(r, 0));
