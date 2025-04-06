
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
const UNIFIED_WB_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjUwMjE3djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc1OTcxOTY3NywiaWQiOiIwMTk2MGI5ZS1jOGU2LTcxMDUtYjU2MC1lMTU2YzA4OWQwZDYiLCJpaWQiOjUwMTA5MjcwLCJvaWQiOjY3NzYzMiwicyI6MTI4LCJzaWQiOiJlNmFjNjYwNC0xZDIxLTQxNWMtOTA1ZC0zZGMwYzRhOGYyYmUiLCJ0IjpmYWxzZSwidWlkIjo1MDEwOTI3MH0.ast0KkuIGky-fGx5nm3ZKeW0Y1-oCIcRPl104niIGBwWzJrKdsOn3cmYh0qoE6Wti1Cc5oCQLy2g94coavG0eQ";
const DEFAULT_OPENAI_API_KEY = "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";

// Получение токена WB из localStorage или использование единого токена
const getWbToken = (): string => {
  const token = localStorage.getItem("wb_token");
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
