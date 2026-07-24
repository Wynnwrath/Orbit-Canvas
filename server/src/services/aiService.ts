export interface AIAnalysisRequest {
  content?: string;
  context?: string;
  roomCode?: string;
}

export interface AIAnalysisResponse {
  title: string;
  bodyHtml: string;
  tip?: string;
}

const TEMPLATE_EMPTY_RESPONSE: AIAnalysisResponse = {
  title: 'SMART TUTOR',
  bodyHtml: `<b>Blank region</b><br />Nothing selected on the canvas. Drag a lasso over a code card to analyze it.`
};

export async function analyzeCode(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const { content, context } = req;

  if (!content || !content.trim()) {
    return TEMPLATE_EMPTY_RESPONSE;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      title: 'SMART TUTOR',
      bodyHtml: `<b>No API Key Configured</b><br />Add <code>GEMINI_API_KEY</code> to <code>server/.env</code> to enable live Gemini AI analysis.`,
      tip: 'Get an API key at https://aistudio.google.com'
    };
  }

  try {
    const prompt = `You are an expert AI Code Tutor on a spatial whiteboard app named Orbit Canvas.
Analyze the following code snippet from file "${context || 'code'}":
\`\`\`
${content}
\`\`\`

Provide a clear code breakdown formatted strictly as JSON with keys:
{
  "overview": "Brief 1-2 sentence overview of what the code does.",
  "bullets": ["Key line or function explanation 1", "Key line or function explanation 2", "Key line or function explanation 3"],
  "tip": "Useful tip for performance, refactoring, or best practices."
}`;

    // Try models in priority order — gemini-2.0-flash is the most broadly available
    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-3.5-flash'];
    let lastError = '';

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`[AI Service] Trying ${model} for "${context || 'code snippet'}" (${content.length} chars)`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI Service] ${model} returned ${response.status}:`, errorText.slice(0, 200));

        // If API key is invalid, no point trying other models
        if (errorText.includes('API_KEY_INVALID') || errorText.includes('API key not valid')) {
          return {
            title: 'SMART TUTOR',
            bodyHtml: `<b>Invalid API Key</b><br />Your <code>GEMINI_API_KEY</code> is not valid. Please generate a new key at <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.`,
            tip: 'Make sure the Generative Language API is enabled for your Google Cloud project.'
          };
        }

        lastError = errorText.slice(0, 300);
        continue; // Try next model
      }

      // Success — parse the response
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        return {
          title: 'SMART TUTOR',
          bodyHtml: `<b>Gemini Response Empty</b><br />No content returned for selected snippet.`,
        };
      }

      try {
        const cleanJsonStr = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        const overviewHtml = parsed.overview ? `<b>What <code>${context || 'code'}</code> does</b><br />${parsed.overview}` : '';
        const bulletsHtml = parsed.bullets && Array.isArray(parsed.bullets) && parsed.bullets.length > 0
          ? `<ul>${parsed.bullets.map((b: string) => `<li>${b}</li>`).join('')}</ul>`
          : '';
        const bodyHtml = `${overviewHtml}${bulletsHtml}`;

        console.log(`[AI Service] ✓ ${model} generated analysis for ${context || 'code card'}`);
        return {
          title: 'SMART TUTOR',
          bodyHtml: bodyHtml || rawText,
          tip: parsed.tip
        };
      } catch (_jsonErr) {
        // Model returned text instead of JSON — format it as HTML
        const formattedHtml = rawText
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\n\n/g, '<br /><br />')
          .replace(/\n\* /g, '<br />• ');
        return {
          title: 'SMART TUTOR',
          bodyHtml: `<b>Analysis of <code>${context || 'code'}</code></b><br />${formattedHtml}`,
          tip: 'Extracted directly from Gemini response.'
        };
      }
    }

    // All models failed
    return {
      title: 'SMART TUTOR',
      bodyHtml: `<b>Gemini API Error</b><br />All models failed. Last error:<br />${lastError}`,
      tip: 'Check your API key and quota at https://aistudio.google.com'
    };

  } catch (err: any) {
    console.error('[AI Service] Exception during Gemini API call:', err?.message || err);
    return {
      title: 'SMART TUTOR',
      bodyHtml: `<b>Connection Error</b><br />Failed to reach Gemini API: ${err?.message || 'Network error'}`,
      tip: 'Ensure server has internet connectivity.'
    };
  }
}
