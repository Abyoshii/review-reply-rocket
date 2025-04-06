
import { ReviewsAPI, QuestionsAPI } from './api';
import { FeedbacksAIService } from './aiService';

// Экспорт всех сервисов для отзывов и вопросов
export const FeedbacksService = {
  reviews: ReviewsAPI,
  questions: QuestionsAPI,
  ai: FeedbacksAIService
};

// Для совместимости с существующим кодом экспортируем также напрямую
export { ReviewsAPI, QuestionsAPI, FeedbacksAIService };

export default FeedbacksService;
