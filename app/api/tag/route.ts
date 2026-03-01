import { NextRequest, NextResponse } from 'next/server';
// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();

const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, link, userId } = body;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not identified' },
        { status: 401 }
      );
    }

    // RATE LIMIT CHECK 
    const now = Date.now();
    const timestamps = rateLimitMap.get(userId) || [];

    const recentTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < WINDOW_MS
    );

    if (recentTimestamps.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    recentTimestamps.push(now);
    rateLimitMap.set(userId, recentTimestamps);
    // END RATE LIMIT CHECK 

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Analyze this curiosity item. Estimate realistic timeRequired in minutes (1-300).

Title: ${title}
${link ? `Link: ${link}` : ''}

contentType: exactly one of "video" | "movie" | "pdf" | "podcast" | "project" | "article" | "other". Bias by link (e.g. YouTube → video, .pdf → pdf) and title (project/build → project).

engagementType must reflect cognitive participation required:
- "passive" = primarily observing or listening with minimal mental effort.
- "active" = requires attention, comprehension, or thoughtful processing.
- "deep" = requires creation, problem-solving, or sustained intense mental effort.
Evaluate educational or technical material by cognitive processing required, not by medium or format. Do NOT automatically classify all videos as passive.

energyLevel must reflect mental effort required, not content type or platform. Use "low" | "medium" | "high" accordingly.

For YouTube links, assume duration is likely between 5 and 60 minutes unless the title or context specifies otherwise.

Return ONLY this strict JSON, no other text:
{"contentType": "video"|"movie"|"pdf"|"podcast"|"project"|"article"|"other", "timeRequired": number, "energyLevel": "low"|"medium"|"high", "engagementType": "passive"|"active"|"deep"}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze item' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: 'No response from API' },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle cases where it might be wrapped in markdown)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);

    const validContentTypes = [
      'video',
      'movie',
      'pdf',
      'podcast',
      'project',
      'article',
      'other',
    ] as const;

    // Validate and sanitize the response
    const result = {
      contentType:
        validContentTypes.includes(parsed.contentType) ? parsed.contentType : 'other',
      timeRequired: Number(parsed.timeRequired) || 15,
      energyLevel:
        parsed.energyLevel === 'low' ||
        parsed.energyLevel === 'medium' ||
        parsed.energyLevel === 'high'
          ? parsed.energyLevel
          : 'medium',
      engagementType:
        parsed.engagementType === 'passive' ||
        parsed.engagementType === 'active' ||
        parsed.engagementType === 'deep'
          ? parsed.engagementType
          : 'active',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in tag API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
