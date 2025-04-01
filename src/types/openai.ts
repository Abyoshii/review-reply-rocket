
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

