import { config } from '../../config.js';
import { MockAIProvider } from './mockProvider.js';
import { GeminiAIProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';

let activeProviderInstance = null;

/**
 * Returns the configured AI Provider instance
 */
export function getAIProvider() {
  if (activeProviderInstance) {
    return activeProviderInstance;
  }

  const { aiProvider, gemini, openai } = config;

  if (aiProvider === 'gemini') {
    if (gemini.apiKey) {
      console.log(`[DevTwin AI] Using Google Gemini (${gemini.model})`);
      activeProviderInstance = new GeminiAIProvider(gemini);
      return activeProviderInstance;
    } else {
      console.warn('[DevTwin AI] GEMINI_API_KEY is not set. Falling back to local Mock/Heuristic engine.');
    }
  } else if (aiProvider === 'openai') {
    if (openai.apiKey) {
      console.log(`[DevTwin AI] Using OpenAI (${openai.model})`);
      activeProviderInstance = new OpenAIProvider(openai);
      return activeProviderInstance;
    } else {
      console.warn('[DevTwin AI] OPENAI_API_KEY is not set. Falling back to local Mock/Heuristic engine.');
    }
  }

  console.log('[DevTwin AI] Using Local Heuristic Digital Twin Engine');
  activeProviderInstance = new MockAIProvider();
  return activeProviderInstance;
}

/**
 * Reset provider instance (useful when config or API keys are updated)
 */
export function resetAIProvider() {
  activeProviderInstance = null;
  return getAIProvider();
}
