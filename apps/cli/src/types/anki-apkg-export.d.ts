declare module 'anki-apkg-export' {
  export default class AnkiExport {
    constructor(deckName: string);
    addCard(front: string, back: string, options?: { tags?: string[] }): void;
    addMedia(name: string, data: Buffer | Uint8Array | ArrayBuffer | string): void;
    save(): Promise<Buffer>;
  }
}
