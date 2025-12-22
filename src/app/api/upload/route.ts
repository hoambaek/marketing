import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Vercel Pro: 최대 30초

// Cloudflare R2 설정
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'musedemaree';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

// R2 클라이언트 생성
function getR2Client() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
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

export async function POST(request: NextRequest) {
  try {
    // 환경변수 확인
    const missingEnvVars = [];
    if (!R2_ACCOUNT_ID) missingEnvVars.push('CLOUDFLARE_R2_ACCOUNT_ID');
    if (!R2_ACCESS_KEY_ID) missingEnvVars.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
    if (!R2_SECRET_ACCESS_KEY) missingEnvVars.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    if (!R2_PUBLIC_URL) missingEnvVars.push('CLOUDFLARE_R2_PUBLIC_URL');

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          error: 'Cloudflare R2 환경변수가 설정되지 않았습니다.',
          missing: missingEnvVars,
        },
        { status: 500 }
      );
    }

    const r2Client = getR2Client();

    if (!r2Client) {
      return NextResponse.json(
        { error: 'R2 클라이언트 생성 실패' },
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

    // Vercel Serverless 제한: 4.5MB (Free), 50MB (Pro)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 4.5MB를 초과할 수 없습니다. (Vercel 제한)' },
        { status: 400 }
      );
    }

    // 파일 확장자 및 MIME 타입 검증
    const allowedMimeTypes = [
      // 이미지
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // 문서
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

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `허용되지 않은 파일 형식입니다: ${file.type}` },
        { status: 400 }
      );
    }

    // 파일 내용 읽기
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 고유 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = getExtensionFromMimeType(file.type);
    const fileName = `attachments/${timestamp}-${randomString}.${extension}`;

    // R2에 업로드
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        })
      );
    } catch (r2Error) {
      console.error('R2 Upload Error:', r2Error);
      return NextResponse.json(
        {
          error: 'R2 업로드 실패',
          details: r2Error instanceof Error ? r2Error.message : String(r2Error),
        },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

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
    console.error('Upload error:', error);
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
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: '파일 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // R2에서 파일 삭제 로직 (필요시 구현)
    // 현재는 Supabase에서만 참조 삭제

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
