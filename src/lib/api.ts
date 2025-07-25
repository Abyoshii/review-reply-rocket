import axios from "axios";
import { 
  GenerateAnswerRequest, 
  GenerateAnswerResponse,
  GenerateAutoAnswersRequest, 
  AutoResponderSettings,
  ReviewRatingType
} from "@/types/openai";
import { toast } from "sonner";
import { FeedbacksService } from "./feedbacks";

// Единый токен для всех API (обновленный)
const UNIFIED_WB_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTU3ODUyNSwiaWQiOiIwMTk2MDMzNC1mYjA2LTc0ZjUtOGIwMC03MjU4YWI4OWM1MzAiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6NzkzNCwic2lkIjoiZTZhYzY2MDQtMWQyMS00MTVjLTkwNWQtM2RjMGM0YThmMmJlIiwidCI6ZmFsc2UsInVpZCI6NTAxMDkyNzB9.e8n-W4xKLY9lpMANMRP4_0xZzKHL8gKAUeaXOkcxO6sLSUWHf_vTCGF5IoBceu5o6Dbj3K9Cu7CCbgRC07myPg";
const DEFAULT_OPENAI_API_KEY = "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";

// Получение токена WB из localStorage или использование единого токена
const getWbToken = (): string => {
  const token = localStorage.getItem("wb_token");
  // Если токен в localStorage отсутствует или устарел, обновляем его
  if (!token || token !== UNIFIED_WB_TOKEN) {
    localStorage.setItem("wb_token", UNIFIED_WB_TOKEN);
    return UNIFIED_WB_TOKEN;
  }
  return token || UNIFIED_WB_TOKEN;
};

// Получение токена OpenAI из localStorage или использование дефолтного
const getOpenaiApiKey = (): string => {
  const token = localStorage.getItem("openai_api_key");
  return token || DEFAULT_OPENAI_API_KEY;
};

// WB API (Экспортируем новый сервис для обратной совместимости)
export const WbAPI = {
  // Получение списка отзывов
  getReviews: FeedbacksService.reviews.getReviews,
  
  // Отправка ответа на отзыв
  sendAnswer: FeedbacksService.reviews.sendAnswer,

  // Редактирование ответа на отзыв
  editAnswer: FeedbacksService.reviews.editAnswer,
  
  // Получение архивных отзывов
  getArchiveReviews: FeedbacksService.reviews.getArchiveReviews,
  
  // Получение количества неотвеченных отзывов
  getUnansweredCount: FeedbacksService.reviews.getUnansweredCount,

  // Получение списка вопросов
  getQuestions: FeedbacksService.questions.getQuestions,

  // Получение количества неотвеченных вопросов
  getUnansweredQuestionsCount: FeedbacksService.questions.getUnansweredQuestionsCount,

  // Работа с вопросом (ответ, редактирование, отклонение, отметка просмотренным)
  handleQuestion: FeedbacksService.questions.handleQuestion
};

// OpenAI API
export const OpenAIAPI = {
  // Генерация ответа на отзыв
  generateAnswer: FeedbacksService.ai.generateAnswer,
  
  // Генерация автоответов для нескольких отзывов
  generateAutoAnswers: FeedbacksService.ai.generateAutoAnswers
};

// Экспортируем новый сервис напрямую для более удобного доступа
export { FeedbacksService };
