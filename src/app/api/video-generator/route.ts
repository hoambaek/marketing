import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

// Initialize Google Gen AI client
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
};

// Start video generation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File | null;

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트를 입력해주세요.' },
        { status: 400 }
      );
    }

    const ai = getAIClient();

    // Prepare generation config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateConfig: any = {
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      config: {
        aspectRatio: '16:9',
        resolution: '1080p', // Full HD 1920x1080
        numberOfVideos: 1,
        personGeneration: 'allow_adult',
      },
    };

    // If image is provided, add it to the request
    if (image) {
      const imageBuffer = await image.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      generateConfig.image = {
        imageBytes: base64Image,
        mimeType: image.type,
      };
    }

    // Start video generation operation
    const operation = await ai.models.generateVideos(generateConfig);

    // Return the operation ID for polling
    return NextResponse.json({
      success: true,
      operationName: operation.name,
      message: '영상 생성이 시작되었습니다. 잠시 기다려주세요.',
    });
  } catch (error) {
    apiLogger.error('Video generation error:', error);

    let errorMessage = '영상 생성 중 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('apiKey')) {
        errorMessage = 'API 키가 유효하지 않습니다.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API 할당량을 초과했습니다.';
      } else if (error.message.includes('not configured')) {
        errorMessage = 'API 키가 설정되지 않았습니다.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Poll operation status using REST API directly
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationName = searchParams.get('operation');

    if (!operationName) {
      return NextResponse.json(
        { error: 'Operation name is required' },
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

    // Use REST API directly to poll operation status
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      apiLogger.error('Operation poll error:', errorData);
      return NextResponse.json(
        { error: '상태 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const operation = await response.json();
    apiLogger.info('Operation response:', JSON.stringify(operation, null, 2));

    if (operation.done) {
      // Video is ready
      apiLogger.info('Operation done, response:', JSON.stringify(operation.response, null, 2));

      // Handle different response structures
      const generatedVideos = operation.response?.generatedVideos;
      const generatedSamples = operation.response?.generateVideoResponse?.generatedSamples;

      const samples = generatedVideos || generatedSamples;

      if (samples && samples.length > 0) {
        const video = samples[0].video;

        if (video && video.uri) {
          // Return video info without API key (will be added by download proxy)
          return NextResponse.json({
            done: true,
            success: true,
            video: {
              name: video.name || operationName,
              uri: video.uri, // Original URI without API key
              mimeType: video.mimeType || 'video/mp4',
            },
          });
        }
      }

      // Check for errors
      if (operation.error) {
        apiLogger.error('Video generation error:', operation.error);
        return NextResponse.json({
          done: true,
          success: false,
          error: operation.error.message || '영상 생성에 실패했습니다.',
        });
      }

      return NextResponse.json({
        done: true,
        success: false,
        error: '영상 생성에 실패했습니다.',
      });
    } else {
      // Still processing
      return NextResponse.json({
        done: false,
        message: '영상 생성 중...',
        metadata: operation.metadata,
      });
    }
  } catch (error) {
    apiLogger.error('Operation polling error:', error);

    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
