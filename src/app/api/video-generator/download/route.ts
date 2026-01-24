import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

// Download video by proxying from Google's servers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUri = searchParams.get('uri');

    if (!videoUri) {
      return NextResponse.json(
        { error: 'Video URI is required' },
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

    // Add API key to the URI if not already present
    const downloadUrl = videoUri.includes('key=')
      ? videoUri
      : `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${apiKey}`;

    // Fetch the video from Google's servers
    const response = await fetch(downloadUrl);

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
