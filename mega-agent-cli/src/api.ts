import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export interface ModelConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const defaultModels: Record<string, ModelConfig> = {
  kilo: {
    name: 'Kilo Code (Free)',
    baseUrl: 'https://api.kilo.code/v1', // Placeholder URL for kilo code
    apiKey: process.env.KILO_API_KEY || '',
    model: 'kilo-hermes-latest', // Assuming some model name
  },
  qwen: {
    name: 'Qwen',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY || '',
    model: 'qwen-max',
  },
  gemini: {
    name: 'Gemini (OpenAI Compatible)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-1.5-pro',
  }
};

let currentConfig = defaultModels.kilo;

export const setModel = (modelId: string, customConfig?: Partial<ModelConfig>) => {
  if (defaultModels[modelId]) {
    currentConfig = { ...defaultModels[modelId], ...customConfig };
  } else if (customConfig && customConfig.baseUrl && customConfig.apiKey && customConfig.model) {
    currentConfig = customConfig as ModelConfig;
  } else {
    throw new Error('Invalid model configuration');
  }
};

export const getClient = () => {
  return new OpenAI({
    apiKey: currentConfig.apiKey,
    baseURL: currentConfig.baseUrl,
  });
};

export const chat = async (messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) => {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: currentConfig.model,
    messages,
  });
  return response.choices[0]?.message?.content || '';
};

export const getCurrentModel = () => currentConfig;
