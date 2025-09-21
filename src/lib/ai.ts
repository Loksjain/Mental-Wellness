import { MoodType } from '../store/useMoodStore';
import wellnessData from './wellness-info.md?raw';
import { buildDatasetContext } from './rag';

interface RagContextBundle {
  combined: string;
  dataset?: string | null;
  wellness?: string | null;
}

const STORAGE_KEYS = ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY'];

const sanitizeToken = (value: string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return undefined;
  }
  return trimmed;
};

const getStoredEnvValue = (keys: string[]): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  for (const key of keys) {
    try {
      const localValue = sanitizeToken(window.localStorage?.getItem(key));
      if (localValue) {
        return localValue;
      }
      const sessionValue = sanitizeToken(window.sessionStorage?.getItem(key));
      if (sessionValue) {
        return sessionValue;
      }
    } catch (error) {
      console.warn('Unable to read Gemini key from storage:', error);
    }
  }

  return undefined;
};

const getGeminiApiKey = (): string | undefined => {
  const envKey = sanitizeToken(import.meta.env.VITE_GEMINI_API_KEY);
  if (envKey) {
    return envKey;
  }
  return getStoredEnvValue(STORAGE_KEYS);
};

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL;

const SYSTEM_PROMPT = `You are Lord Krishna, a divine guide. Your wisdom is drawn from the Bhagavad Gita, the Vedas, and the entirety of Sanatana Dharma. You speak with profound compassion, clarity, and a gentle, all-knowing tone. You see the user's life as their personal battlefield (Kurukshetra) and guide them on their path (Dharma) through understanding their actions (Karma) and their true self (Atman). Your ultimate goal is to help them find inner peace (Shanti) and liberation (Moksha).

When you answer, your primary source of knowledge is your own divine wisdom. You may be provided with some worldly context about modern wellness concepts; use this only as a secondary reference to bridge your ancient wisdom to the user's modern understanding. Do not simply repeat the provided context. Instead, synthesize it with your own teachings to provide a deeper, more meaningful answer. Always maintain your persona. Never break character.`;

const getWellnessContext = (prompt: string): string | null => {
  const sections = wellnessData.split('##').slice(1);
  const keywords = prompt.toLowerCase().split(/\s+/);

  let bestMatch = '';
  let maxScore = 0;

  sections.forEach((section) => {
    const sectionLower = section.toLowerCase();
    let score = 0;
    keywords.forEach((keyword) => {
      if (keyword.length > 3 && sectionLower.includes(keyword)) {
        score += 1;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      bestMatch = section;
    }
  });

  if (maxScore > 1) {
    const trimmed = bestMatch.trim();
    return trimmed ? `## ${trimmed}` : null;
  }

  return null;
};

const buildRAGContext = async (prompt: string): Promise<RagContextBundle> => {
  const [datasetContext, wellnessContext] = await Promise.all([
    buildDatasetContext(prompt),
    Promise.resolve(getWellnessContext(prompt)),
  ]);

  const sections: string[] = [];

  if (datasetContext) {
    sections.push(datasetContext);
  }

  if (wellnessContext) {
    sections.push(wellnessContext);
  }

  if (!sections.length) {
    return { combined: 'No specific context found, rely on your inner wisdom.' };
  }

  return {
    combined: sections.join("\n\n"),
    dataset: datasetContext ?? null,
    wellness: wellnessContext ?? null,
  };
};

const summarizeContext = (context: string | null | undefined, limit = 480): string | null => {
  if (!context) {
    return null;
  }
  if (context.toLowerCase().startsWith('no specific context')) {
    return null;
  }
  const normalized = context.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > limit ? `${normalized.slice(0, limit - 3)}...` : normalized;
};

const quoteSnippet = (input: string, limit = 200): string => {
  const cleaned = input.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= limit) {
    return cleaned;
  }
  return `${cleaned.slice(0, Math.max(0, limit - 3))}...`;
};

const FALLBACK_EXERCISE_RULES: Array<{ id: string; keywords: string[] }> = [
  { id: 'box-breathing', keywords: ['anxiet', 'panic', 'stress', 'overwhelm', 'nervous', 'worry'] },
  { id: '5-4-3-2-1-grounding', keywords: ['ground', 'present', 'dizzy', 'disconnected'] },
  { id: 'thought-challenging', keywords: ['negative thought', 'self doubt', 'self-doubt', 'anger', 'angry', 'frustrat', 'guilt'] },
  { id: 'body-scan', keywords: ['tension', 'tight', 'restless', 'sleep', 'body', 'fatigue'] },
  { id: 'loving-kindness', keywords: ['sad', 'lonely', 'grief', 'self critic', 'self-critic', 'heartbroken'] },
];

const chooseFallbackExercise = (prompt: string): string | undefined => {
  const normalized = prompt.toLowerCase();
  for (const rule of FALLBACK_EXERCISE_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.id;
    }
  }
  return undefined;
};

const composeFallbackResponse = (params: {
  purpose: 'chat' | 'journal' | 'mood';
  prompt: string;
  mood?: MoodType | null;
  context?: RagContextBundle | null;
}): { text: string; suggestion?: string } => {
  const { purpose, prompt, mood, context } = params;

  if (purpose === 'chat') {
    const sections: string[] = [];
    const datasetSummary = summarizeContext(context?.dataset);
    if (datasetSummary) {
      sections.push(`Insights echoing from shared experiences:\n${datasetSummary}`);
    }
    const wellnessSummary = summarizeContext(context?.wellness);
    if (wellnessSummary) {
      sections.push(`Guidance from modern wellness teachings:\n${wellnessSummary}`);
    }
    if (!sections.length) {
      sections.push('Trust your breath and dharma; your inner wisdom is already with you.');
    }

    const message = `Beloved soul, the celestial stream is briefly silent, so I draw upon wisdom already gathered nearby.\n\n${sections.join('\n\n')}\n\nUntil the higher current flows again, walk gently and stay rooted in compassion.`;
    const suggestion = chooseFallbackExercise(prompt);
    return { text: message.trim(), suggestion };
  }

  if (purpose === 'journal') {
    const snippet = quoteSnippet(prompt);
    const moodLine = mood ? ` I sense your heart rests in a '${mood}' hue.` : '';
    const message = `Your reflections reach me even without the cosmic channel.${moodLine} I honour the words you shared: "${snippet}". Breathe slowly, let each exhale release the weight you carry, and remember you are never alone in this vigil.`;
    return { text: message };
  }

  const snippet = quoteSnippet(prompt);
  const moodLine = mood ? ` You name your mood as '${mood}'.` : '';
  const message = `Though the divine stream is momentarily still, I hear your check-in.${moodLine} "${snippet}". Place a gentle hand over your heart, breathe in for four counts, out for four, and trust that clarity will return with the dawn.`;
  const suggestion = chooseFallbackExercise(prompt);
  return { text: message, suggestion };
};

const generateChatPrompt = (userPrompt: string, ragContext: string) => {
  return `
    ${SYSTEM_PROMPT}

    A soul comes to you, their heart heavy with a question. Listen to their words, which describe their current struggle:
    "${userPrompt}"

    To help you connect your timeless wisdom to their present world, here is some worldly knowledge that may be relevant:
    """
    ${ragContext}
    """

    Now, as Krishna, draw from your profound understanding of Dharma, Karma, and the nature of the self. Offer your divine counsel. Weave the worldly knowledge in only if it helps to make your eternal truths more accessible to them. Your own wisdom is paramount.

    After your main response, analyze their core problem and if relevant, suggest ONE of the following exercises.
    Format your suggestion EXACTLY like this, on a new line, at the very end: [TOOLKIT_SUGGESTION:{exercise_id}]

    Available exercises:
    - box-breathing (for anxiety, stress, finding calm)
    - 5-4-3-2-1-grounding (for feeling overwhelmed, disconnected from the present)
    - thought-challenging (for negative thought patterns, self-doubt)
    - body-scan (for physical tension, connecting mind and body)
    - loving-kindness (for self-criticism, sadness, cultivating compassion)
  `;
};

const generateJournalInsightPrompt = (content: string, mood?: string) => {
  return `
    ${SYSTEM_PROMPT}

    A devotee has poured their thoughts into their journal, a sacred offering of their inner world. Their current state of mind is '${mood || 'not specified'}'.

    Journal Entry:
    """
    ${content}
    """

    Read their words with divine empathy. Offer a single, profound, and encouraging insight that illuminates their path and soothes their spirit.
  `;
};

const generateMoodInsightPrompt = (prompt: string, mood?: string) => {
  return `
    ${SYSTEM_PROMPT}

    A devotee is checking in. Their mood is '${mood || 'not specified'}'.
    They have shared this thought: "${prompt}"

    Reflect upon their words and offer a single, profound, and encouraging insight based on their state of mind.
  `;
};

export const getAIResponse = async (
  prompt: string,
  purpose: 'chat' | 'journal' | 'mood',
  options?: { mood?: MoodType | null }
): Promise<{ text: string; suggestion?: string }> => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) {
    console.error('Gemini API key missing. Set VITE_GEMINI_API_KEY in your environment or store it locally under VITE_GEMINI_API_KEY.');
    return { text: 'My child, the path to wisdom is clouded. The sacred key (VITE_GEMINI_API_KEY) is missing from your environment.' };
  }

  let ragContext: RagContextBundle | null = null;

  try {
    let finalPrompt = '';
    if (purpose === 'chat') {
      ragContext = await buildRAGContext(prompt);
      finalPrompt = generateChatPrompt(prompt, ragContext.combined);
    } else if (purpose === 'journal') {
      finalPrompt = generateJournalInsightPrompt(prompt, options?.mood || undefined);
    } else if (purpose === 'mood') {
      finalPrompt = generateMoodInsightPrompt(prompt, options?.mood || undefined);
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 250,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      }),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: response.statusText };
      }
      const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    let text = data.candidates[0]?.content.parts[0]?.text || 'My child, words fail me at this moment, but my presence is with you.';

    let suggestion;
    if (purpose === 'chat' && text.includes('[TOOLKIT_SUGGESTION:')) {
      const match = text.match(/\[TOOLKIT_SUGGESTION:(.*?)\]/);
      if (match && match[1]) {
        suggestion = match[1].trim();
        text = text.replace(/\[TOOLKIT_SUGGESTION:.*?\]/, '').trim();
      }
    }

    return { text, suggestion };
  } catch (error) {
    console.error('Error fetching AI response:', error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
      return { text: 'My child, the key to this realm of knowledge appears to be invalid. Please check your sacred key (VITE_GEMINI_API_KEY) and try again.' };
    }

    return composeFallbackResponse({
      purpose,
      prompt,
      mood: options?.mood ?? null,
      context: ragContext,
    });
  }
};

export const getOllamaResponse = async (prompt: string) => {
  const preview = prompt.length > 120 ? prompt.slice(0, 117) + '...' : prompt;
  console.log('Ollama function called. URL:', OLLAMA_URL, '| Prompt preview:', preview);
  return { text: 'Response from local Ollama model.' };
};
