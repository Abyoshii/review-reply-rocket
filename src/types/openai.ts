
// Типы для работы с API OpenAI

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateAnswerRequest {
  reviewText: string;
  reviewId: string;
}

export interface GenerateAnswerResponse {
  reviewId: string;
  answer: string;
  modelUsed: string;
}

export interface AutoResponderSettings {
  model: "gpt-3.5-turbo" | "gpt-4" | "gpt-4o" | "auto";
  maxReviewsPerRequest: 5 | 10 | 20;
  language: "russian" | "english" | "kazakh";
  tone: "professional" | "friendly" | "formal";
  useEmoji: boolean;
  signature?: string;
}

export interface GenerateAutoAnswersRequest {
  settings: AutoResponderSettings;
  reviews: {
    id: string;
    text?: string;
    pros?: string;
    cons?: string;
  }[];
}
