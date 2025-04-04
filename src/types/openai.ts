
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
  productName?: string;
  rating?: number; // Добавлено поле рейтинга для обработки отзыва
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
  temperature?: number;
  customPrompt?: string;
  // Новые поля для рейтингов
  templates?: {
    positive?: string; // Шаблон для хороших отзывов (4-5 звезд)
    neutral?: string;  // Шаблон для нейтральных отзывов (3 звезды)
    negative?: string; // Шаблон для плохих отзывов (1-2 звезды)
  };
  // Настройки фильтрации для автоответчика
  filters?: {
    minRating?: number; // Минимальный рейтинг для автоответа
    maxRating?: number; // Максимальный рейтинг для автоответа
    keywords?: string[]; // Ключевые слова для фильтрации
  };
}

export interface GenerateAutoAnswersRequest {
  settings: AutoResponderSettings;
  reviews: {
    id: string;
    text?: string;
    pros?: string;
    cons?: string;
    productName?: string;
    rating?: number; // Добавлено поле рейтинга
  }[];
}

export interface AutoResponseServiceStatus {
  isRunning: boolean;
  lastCheck: Date | null;
  processedCount: number;
  successCount: number;
  failedCount: number;
}

// Интерфейс для определения типа отзыва по рейтингу
export interface ReviewRatingType {
  type: "positive" | "neutral" | "negative";
  rating: number;
}

// Интерфейс для настроек безопасной авторизации
export interface SecuritySettings {
  useHeaderApiKey: boolean;
  headerName: string;
  obfuscateTokens: boolean;
}
