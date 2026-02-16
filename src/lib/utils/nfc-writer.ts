/// <reference path="../../types/web-nfc.d.ts" />

const BASE_URL = 'https://musedemaree.com/b';

export function isNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export function getBottleUrl(nfcCode: string): string {
  return `${BASE_URL}/${nfcCode}`;
}

export async function writeNfcTag(
  nfcCode: string
): Promise<{ success: boolean; error?: string }> {
  if (!isNfcSupported()) {
    return { success: false, error: 'NFC가 지원되지 않는 기기입니다' };
  }

  try {
    const reader = new NDEFReader();
    const url = getBottleUrl(nfcCode);

    await reader.write({
      records: [{ recordType: 'url', data: url }],
    });

    return { success: true };
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'NFC 권한이 거부되었습니다' };
      }
      if (error.name === 'NotReadableError') {
        return { success: false, error: 'NFC 태그를 읽을 수 없습니다. 다시 시도해주세요' };
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'NFC 쓰기 실패',
    };
  }
}
