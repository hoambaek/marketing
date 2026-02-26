import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';

export const maxDuration = 120;

const XSKILL_API_URL = 'https://api.xskill.ai/api/v3';

// Seedance 2.0 영상 생성
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, ratio, duration, firstFrameUrl, lastFrameUrl, model: requestModel } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트를 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.XSKILL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'xSkill API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // filePaths: 첫/마지막 프레임 URL 배열
    const filePaths: string[] = [];
    if (firstFrameUrl) filePaths.push(firstFrameUrl);
    if (lastFrameUrl) filePaths.push(lastFrameUrl);

    // functionMode 결정: 이미지가 있으면 first_last_frames, 없으면 omni_reference
    const functionMode = filePaths.length > 0 ? 'first_last_frames' : 'omni_reference';

    // 모델 설정: seedance 2.0 또는 1.5 pro
    const isSeedance15 = requestModel === 'seedance-1.5-pro';
    const outerModel = isSeedance15
      ? 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video'
      : 'st-ai/super-seed2';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { prompt };

    if (isSeedance15) {
      // Seedance 1.5 Pro: image_url 필수, end_image_url 선택, duration은 string
      if (!firstFrameUrl) {
        return NextResponse.json(
          { error: 'Seedance 1.5 Pro는 첫 프레임 이미지가 필수입니다.' },
          { status: 400 }
        );
      }
      params.image_url = firstFrameUrl;
      if (lastFrameUrl) {
        params.end_image_url = lastFrameUrl;
      }
      params.aspect_ratio = ratio || '16:9';
      params.duration = String(duration || 5);
    } else {
      // Seedance 2.0: 내부 model, functionMode, filePaths, duration은 integer
      params.model = 'seedance_2.0_fast';
      params.ratio = ratio || '16:9';
      params.duration = duration || 5;
      params.functionMode = functionMode;
      if (filePaths.length > 0) {
        params.filePaths = filePaths;
      }
    }

    const requestBody = {
      model: outerModel,
      params,
    };

    apiLogger.info('Seedance request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${XSKILL_API_URL}/tasks/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok || data.detail) {
      apiLogger.error('Seedance API error:', data);
      return NextResponse.json(
        { error: data.detail || data.message || `API 오류 (${response.status})` },
        { status: response.status }
      );
    }

    apiLogger.info('Seedance task created:', data);

    return NextResponse.json({
      success: true,
      taskId: data.data?.task_id || data.task_id,
      message: '영상 생성이 시작되었습니다.',
    });
  } catch (error) {
    apiLogger.error('Seedance generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '영상 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Seedance 작업 상태 폴링
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const apiKey = process.env.XSKILL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const response = await fetch(`${XSKILL_API_URL}/tasks/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    const data = await response.json();
    apiLogger.info('Seedance task status:', JSON.stringify(data, null, 2));

    const status = data.data?.status || data.status;
    const output = data.data?.output || data.data?.result?.output;

    // 응답 구조: output.video.url (Seedance 1.5 Pro) 또는 output.images[0] (Seedance 2.0)
    const videoUrl = output?.video?.url || output?.images?.[0];

    if (status === 'completed' && videoUrl) {
      return NextResponse.json({
        done: true,
        success: true,
        video: {
          uri: videoUrl,
          mimeType: output?.video?.content_type || 'video/mp4',
        },
      });
    }

    if (status === 'failed') {
      return NextResponse.json({
        done: true,
        success: false,
        error: data.data?.error || '영상 생성에 실패했습니다.',
      });
    }

    // pending / processing
    return NextResponse.json({
      done: false,
      status,
      message: status === 'processing' ? '영상 생성 중...' : '대기 중...',
    });
  } catch (error) {
    apiLogger.error('Seedance polling error:', error);
    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
