/**
 * Web NFC API 타입 선언
 * https://w3c.github.io/web-nfc/
 */

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView | ArrayBuffer | string;
  encoding?: string;
  lang?: string;
}

interface NDEFWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}

interface NDEFScanOptions {
  signal?: AbortSignal;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

declare class NDEFReader {
  constructor();
  scan(options?: NDEFScanOptions): Promise<void>;
  write(
    message: NDEFMessage | string,
    options?: NDEFWriteOptions
  ): Promise<void>;
  addEventListener(
    type: 'reading',
    listener: (event: NDEFReadingEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: 'readingerror',
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface Window {
  NDEFReader?: typeof NDEFReader;
}
