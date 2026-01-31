import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';
import { envValidators, EnvError } from '@/lib/env';

export const dynamic = 'force-dynamic';

// R2 클라이언트 생성 (환경 변수 검증 포함)
function getR2Client() {
  try {
    const config = envValidators.requireR2Config();
    return {
      client: new S3Client({
        region: 'auto',
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
      config,
    };
  } catch (error) {
    if (error instanceof EnvError) {
      return null;
    }
    throw error;
  }
}

// MIME 타입에서 확장자 추출
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/haansoft-hwp': 'hwp',
    'application/x-hwp': 'hwp',
  };
  return mimeToExt[mimeType] || 'bin';
}

// 파일 타입 분류
function getAttachmentType(mimeType: string): 'image' | 'document' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'document';
}

// 허용된 MIME 타입
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/haansoft-hwp',
  'application/x-hwp',
];

// Magic Bytes 정의 (파일 시그니처)
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WEBP는 RIFF 컨테이너)
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // Office 2007+ 포맷 (ZIP 기반)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [[0x50, 0x4B, 0x03, 0x04]],
  // Office 97-2003 포맷 (OLE)
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.ms-powerpoint': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  // HWP
  'application/haansoft-hwp': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/x-hwp': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
};

// Magic Bytes 검증 함수
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];

  // 검증 대상이 아닌 타입은 통과 (text/plain, text/csv, image/svg+xml 등)
  if (!signatures) {
    return true;
  }

  // 최소 시그니처 길이보다 파일이 작으면 실패
  const minLength = Math.max(...signatures.map(s => s.length));
  if (buffer.length < minLength) {
    return false;
  }

  // 시그니처 중 하나라도 일치하면 통과
  return signatures.some(signature => {
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  });
}

// GET: Presigned URL 발급 (큰 파일 직접 업로드용)
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const fileSize = searchParams.get('fileSize');

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: '파일 이름과 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    // fileSize 필수 검증
    if (!fileSize) {
      return NextResponse.json(
        { error: '파일 크기가 필요합니다.' },
        { status: 400 }
      );
    }

    // MIME 타입 검증
    if (!allowedMimeTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `허용되지 않은 파일 형식입니다: ${fileType}` },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (fileSize && parseInt(fileSize) > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // R2 클라이언트 생성 (환경 변수 검증 포함)
    const r2 = getR2Client();
    if (!r2) {
      return NextResponse.json(
        { error: 'R2 환경변수가 설정되지 않았습니다.', hint: 'CLOUDFLARE_R2_* 환경 변수를 확인하세요.' },
        { status: 500 }
      );
    }

    // 고유 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = getExtensionFromMimeType(fileType);
    const key = `attachments/${timestamp}-${randomString}.${extension}`;

    // 파일 크기를 숫자로 변환
    const fileSizeNum = parseInt(fileSize);

    // Presigned URL 생성 - ContentLength 조건 추가로 업로드 크기 강제
    const command = new PutObjectCommand({
      Bucket: r2.config.bucketName,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSizeNum, // 정확한 파일 크기 강제
    });

    const presignedUrl = await getSignedUrl(r2.client, command, { expiresIn: 300 });

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl: `${r2.config.publicUrl}/${key}`,
      id: `${timestamp}-${randomString}`,
      type: getAttachmentType(fileType),
    });
  } catch (error) {
    apiLogger.error('Presigned URL error:', error);
    return NextResponse.json(
      {
        error: 'Presigned URL 생성 실패',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: 작은 파일 직접 업로드 (4MB 이하)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // R2 클라이언트 생성 (환경 변수 검증 포함)
    const r2 = getR2Client();
    if (!r2) {
      return NextResponse.json(
        { error: 'R2 환경변수가 설정되지 않았습니다.', hint: 'CLOUDFLARE_R2_* 환경 변수를 확인하세요.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // Vercel 요청 크기 제한: 4MB (안전 마진)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'USE_PRESIGNED_URL', message: '파일이 4MB를 초과합니다. Presigned URL을 사용하세요.' },
        { status: 413 }
      );
    }

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `허용되지 않은 파일 형식입니다: ${file.type}` },
        { status: 400 }
      );
    }

    // 파일 내용 읽기
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Magic Bytes 검증 (파일 내용 기반 MIME 타입 확인)
    if (!validateMagicBytes(buffer, file.type)) {
      apiLogger.warn('Magic bytes validation failed', {
        claimedType: file.type,
        fileName: file.name,
      });
      return NextResponse.json(
        { error: '파일 내용이 확장자와 일치하지 않습니다. 올바른 파일을 업로드해주세요.' },
        { status: 400 }
      );
    }

    // 고유 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = getExtensionFromMimeType(file.type);
    const fileName = `attachments/${timestamp}-${randomString}.${extension}`;

    // R2에 업로드
    try {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.config.bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        })
      );
    } catch (r2Error) {
      apiLogger.error('R2 Upload Error:', r2Error);
      return NextResponse.json(
        {
          error: 'R2 업로드 실패',
          details: r2Error instanceof Error ? r2Error.message : String(r2Error),
        },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const publicUrl = `${r2.config.publicUrl}/${fileName}`;

    // 응답 데이터
    const attachmentData = {
      id: `${timestamp}-${randomString}`,
      type: getAttachmentType(file.type),
      name: file.name,
      url: publicUrl,
      size: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(attachmentData);
  } catch (error) {
    apiLogger.error('Upload error:', error);
    return NextResponse.json(
      {
        error: '파일 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE: 파일 삭제 (선택적)
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: '파일 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 R2 삭제 구현 필요 - 현재는 미지원 응답
    return NextResponse.json(
      { error: '파일 삭제 기능은 현재 지원되지 않습니다.' },
      { status: 501 }
    );
  } catch (error) {
    apiLogger.error('Delete error:', error);
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
