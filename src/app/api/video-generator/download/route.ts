import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';

// SSRF 방어: 허용된 호스트 화이트리스트
const ALLOWED_HOSTS = [
  'generativelanguage.googleapis.com',
  'storage.googleapis.com',
  'video.googleapis.com',
];

// Download video by proxying from Google's servers
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
    const videoUri = searchParams.get('uri');

    if (!videoUri) {
      return NextResponse.json(
        { error: 'Video URI is required' },
        { status: 400 }
      );
    }

    // SSRF 방어: URL 파싱 및 호스트 검증
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(videoUri);
    } catch {
      apiLogger.warn('SSRF attempt blocked: Invalid URI format', { videoUri });
      return NextResponse.json(
        { error: 'Invalid video URI format' },
        { status: 400 }
      );
    }

    // 허용된 호스트인지 확인
    if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
      apiLogger.warn('SSRF attempt blocked: Unauthorized host', {
        hostname: parsedUrl.hostname,
        videoUri
      });
      return NextResponse.json(
        { error: 'Unauthorized video source' },
        { status: 403 }
      );
    }

    // HTTPS만 허용
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    // Fetch the video from Google's servers with API key header
    const response = await fetch(videoUri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!response.ok) {
      apiLogger.error('Video download failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: '영상 다운로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    const videoBuffer = await response.arrayBuffer();

    // Return the video file
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="generated-video-1080p.mp4"',
        'Content-Length': videoBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    apiLogger.error('Video download error:', error);

    return NextResponse.json(
      { error: '다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
