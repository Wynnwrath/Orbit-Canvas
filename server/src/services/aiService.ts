export interface AIAnalysisRequest {
  content?: string;
  context?: string;
  image?: string; // base64 image data URL or raw base64 string
  roomCode?: string;
}

export interface AIAnalysisResponse {
  title: string;
  bodyHtml: string;
  tip?: string;
}

const TEMPLATE_EMPTY_RESPONSE: AIAnalysisResponse = {
  title: 'SMART TUTOR',
  bodyHtml: `<b>Blank region</b><br />Nothing selected on the canvas. Drag a lasso over drawings or code cards to analyze.`
};

export async function analyzeCode(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const { content, context, image } = req;

  const hasContent = content && content.trim();
  const hasImage = image && image.trim();

  if (!hasContent && !hasImage) {
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
    const promptText = `You are a Smart AI Tutor on a spatial whiteboard app named Orbit Canvas.
Analyze the following visual drawing, diagram, handwritten math/code, or code snippet captured from the whiteboard (context: "${context || 'whiteboard region'}"):
${hasContent ? `\`\`\`\n${content}\n\`\`\`` : ''}

Provide a clear, helpful breakdown formatted strictly as JSON with keys:
{
  "overview": "Brief 1-2 sentence overview of what the drawing, diagram, math, or code represents.",
  "bullets": ["Key insight or explanation step 1", "Key insight or explanation step 2", "Key insight or explanation step 3"],
  "tip": "Useful tip for improvement, best practices, or related concepts."
}`;

    // Prepare Gemini request parts
    const parts: any[] = [{ text: promptText }];

    // If an image (drawing / canvas screenshot) is attached, add inline_data part
    if (hasImage) {
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: base64Data
        }
      });
    }

    // Try models in priority order — gemini-2.0-flash is the most broadly available multimodal model
    const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-3.5-flash'];
    let lastError = '';

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`[AI Service] Trying ${model} for "${context || 'whiteboard region'}" (image attached: ${!!hasImage})`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI Service] ${model} returned ${response.status}:`, errorText.slice(0, 200));

        if (errorText.includes('API_KEY_INVALID') || errorText.includes('API key not valid')) {
          return {
            title: 'SMART TUTOR',
            bodyHtml: `<b>Invalid API Key</b><br />Your <code>GEMINI_API_KEY</code> is not valid. Please generate a key at <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.`,
            tip: 'Ensure Generative Language API is enabled.'
          };
        }

        lastError = errorText.slice(0, 300);
        continue;
      }

      // Success
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        return {
          title: 'SMART TUTOR',
          bodyHtml: `<b>Gemini Response Empty</b><br />No content returned for selected region.`,
        };
      }

      try {
        const cleanJsonStr = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        const overviewHtml = parsed.overview ? `<b>Analysis of <code>${context || 'selected region'}</code></b><br />${parsed.overview}` : '';
        const bulletsHtml = parsed.bullets && Array.isArray(parsed.bullets) && parsed.bullets.length > 0
          ? `<ul>${parsed.bullets.map((b: string) => `<li>${b}</li>`).join('')}</ul>`
          : '';
        const bodyHtml = `${overviewHtml}${bulletsHtml}`;

        console.log(`[AI Service] ✓ ${model} generated multimodal analysis for ${context || 'whiteboard region'}`);
        return {
          title: 'SMART TUTOR',
          bodyHtml: bodyHtml || rawText,
          tip: parsed.tip
        };
      } catch (_jsonErr) {
        const formattedHtml = rawText
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\n\n/g, '<br /><br />')
          .replace(/\n\* /g, '<br />• ');
        return {
          title: 'SMART TUTOR',
          bodyHtml: `<b>Analysis of <code>${context || 'selected region'}</code></b><br />${formattedHtml}`,
          tip: 'Extracted directly from Gemini multimodal response.'
        };
      }
    }

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
