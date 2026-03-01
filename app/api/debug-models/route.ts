import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: response.status }
      );
    }

    const data = (await response.json()) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
        supported_generation_methods?: string[];
      }>;
    };

    const models = data.models ?? [];

    const names = models
      .filter((m) => {
        const methods =
          m.supportedGenerationMethods ?? m.supported_generation_methods ?? [];
        return methods.includes('generateContent');
      })
      .map((m) => (m.name ?? '').replace('models/', ''))
      .filter(Boolean);

    return NextResponse.json({ modelNames: names });
  } catch (error) {
    console.error('Error in debug-models API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
