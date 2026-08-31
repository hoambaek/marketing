// Web NFC 전역 타입은 src/types/web-nfc.d.ts에 있다.
// tsconfig의 include가 모든 .ts를 이미 잡으므로 참조 지시자가 필요 없다.

const BASE_URL = 'https://musedemaree.com/b';

export type NfcWriteResult = {
  success: boolean;
  /** 사용자에게 그대로 보여줄 한국어 문장 */
  error?: string;
  /** 취소(닫기·타임아웃)로 끝난 경우. 에러 화면 대신 조용히 되돌린다 */
  aborted?: boolean;
};

export function isNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * NFC를 쓸 수 없는 이유. 쓸 수 있으면 null.
 * "지원 안 함" 한 문장으로 뭉치면 https 문제인지 브라우저 문제인지 현장에서 구분할 수가 없다.
 */
export function getNfcBlocker(): string | null {
  if (typeof window === 'undefined') return null;
  if (!window.isSecureContext) {
    return 'HTTPS로 접속해야 NFC를 쓸 수 있습니다. 로컬 IP(http://192.168...)가 아니라 https:// 주소로 열어주세요.';
  }
  if (!('NDEFReader' in window)) {
    return '이 브라우저는 NFC 쓰기를 지원하지 않습니다. 안드로이드 Chrome으로 열어주세요 (삼성 인터넷·iOS는 안 됩니다).';
  }
  return null;
}

export function getBottleUrl(nfcCode: string): string {
  return `${BASE_URL}/${nfcCode}`;
}

/** 사이트에 NFC 권한이 아예 거부돼 있으면 write()는 프롬프트 없이 바로 실패한다 */
async function isPermissionDenied(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: 'nfc' as PermissionName });
    return status.state === 'denied';
  } catch {
    // 이 브라우저가 nfc 권한 조회를 모르면 판단하지 않는다
    return false;
  }
}

const PERMISSION_HELP =
  'NFC 권한이 거부돼 있습니다. 주소창 왼쪽 자물쇠 → 권한(사이트 설정) → NFC를 "허용"으로 바꾼 뒤 다시 시도하세요.';

export async function writeNfcTag(
  nfcCode: string,
  options?: { signal?: AbortSignal }
): Promise<NfcWriteResult> {
  const blocker = getNfcBlocker();
  if (blocker) {
    return { success: false, error: blocker };
  }

  if (await isPermissionDenied()) {
    return { success: false, error: PERMISSION_HELP };
  }

  try {
    const reader = new NDEFReader();
    const url = getBottleUrl(nfcCode);

    // signal이 없으면 write()는 태그가 닿을 때까지 무한정 기다린다. 호출자가 반드시 넘긴다.
    await reader.write(
      { records: [{ recordType: 'url', data: url }] },
      { overwrite: true, signal: options?.signal }
    );

    return { success: true };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';

    if (name === 'AbortError') {
      return { success: false, aborted: true, error: 'NFC 쓰기를 취소했습니다' };
    }
    if (name === 'NotAllowedError') {
      return { success: false, error: PERMISSION_HELP };
    }
    if (name === 'NotSupportedError') {
      return {
        success: false,
        error: '휴대폰의 NFC가 꺼져 있거나 이 태그에는 쓸 수 없습니다. 설정 → 연결 → NFC를 켜고 다시 시도하세요. (NotSupportedError)',
      };
    }
    if (name === 'NotReadableError') {
      return {
        success: false,
        error: '태그를 읽지 못했습니다. 태그를 뒷면 카메라 바로 아래에 붙이고 3초쯤 대고 계세요. (NotReadableError)',
      };
    }
    if (name === 'NetworkError') {
      return {
        success: false,
        error: '쓰는 도중 태그가 떨어졌습니다. 움직이지 말고 다시 시도하세요. (NetworkError)',
      };
    }
    if (name === 'InvalidStateError') {
      return {
        success: false,
        error: '이미 다른 NFC 작업이 진행 중입니다. 잠시 후 다시 시도하세요. (InvalidStateError)',
      };
    }

    const detail = error instanceof Error ? error.message : String(error);
    return { success: false, error: `NFC 쓰기 실패: ${detail}${name ? ` (${name})` : ''}` };
  }
}
