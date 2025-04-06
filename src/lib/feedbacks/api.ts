
import axios from "axios";
import { 
  ReviewListParams, 
  WbReviewsResponse, 
  WbAnswerRequest, 
  WbAnswerResponse,
  QuestionListParams,
  WbQuestionsResponse,
  WbQuestionAnswerRequest,
  WbQuestionAnswerResponse,
  WbEditAnswerRequest,
  WbEditAnswerResponse,
  WbArchiveReviewsResponse
} from "@/types/wb";
import { toast } from "sonner";
import { getApiToken } from "../securityUtils";

// Base URL для API отзывов и вопросов
const FEEDBACKS_API_BASE_URL = "https://feedbacks-api.wildberries.ru/api/v1";
const FEEDBACKS_URL = `${FEEDBACKS_API_BASE_URL}/feedbacks`;
const QUESTIONS_URL = `${FEEDBACKS_API_BASE_URL}/questions`;

// Получение актуального токена
const getToken = (): string => {
  return getApiToken();
};

// Конфигурация Axios для запросов к API отзывов и вопросов
const createFeedbacksApiClient = () => {
  const client = axios.create({
    baseURL: FEEDBACKS_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Интерцептор для добавления актуального токена к каждому запросу
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

// Создаем клиент API для отзывов и вопросов
const feedbacksClient = createFeedbacksApiClient();

/**
 * API для работы с отзывами
 */
export const ReviewsAPI = {
  // Получение списка отзывов
  getReviews: async (params: ReviewListParams): Promise<WbReviewsResponse> => {
    try {
      console.log("Feedbacks API: Fetching reviews with params:", params);
      
      const response = await feedbacksClient.get(`/feedbacks`, {
        params: params,
      });
      
      console.log("Feedbacks API: Response received:", response.data);
      return response.data;
    } catch (error) {
      console.error("Feedbacks API: Error fetching reviews:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка получения отзывов: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка получения отзывов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Отправка ответа на отзыв
  sendAnswer: async (data: WbAnswerRequest): Promise<WbAnswerResponse> => {
    try {
      const response = await feedbacksClient.post(`/feedbacks/answer`, data);
      return response.data;
    } catch (error) {
      console.error("Feedbacks API: Error sending answer:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка отправки ответа: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка отправки ответа. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },

  // Редактирование ответа на отзыв
  editAnswer: async (data: WbEditAnswerRequest): Promise<WbEditAnswerResponse> => {
    try {
      const response = await feedbacksClient.patch(`/feedbacks/answer`, data);
      return response.data;
    } catch (error) {
      console.error("Feedbacks API: Error editing answer:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка редактирования ответа: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка редактирования ответа. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Получение архивных отзывов
  getArchiveReviews: async (params: ReviewListParams): Promise<WbArchiveReviewsResponse> => {
    try {
      console.log("Feedbacks API: Fetching archive reviews with params:", params);
      
      const response = await feedbacksClient.get(`/feedbacks/archive`, {
        params: params,
      });
      
      console.log("Feedbacks API: Archive response received:", response.data);
      return response.data;
    } catch (error) {
      console.error("Feedbacks API: Error fetching archive reviews:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка получения архивных отзывов: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка получения архивных отзывов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },
  
  // Получение количества неотвеченных отзывов
  getUnansweredCount: async (): Promise<number> => {
    try {
      console.log("Feedbacks API: Fetching unanswered count...");
      const response = await feedbacksClient.get(`/feedbacks`, {
        params: {
          isAnswered: false,
          take: 1,
          skip: 0,
        },
      });
      
      console.log("Feedbacks API: Unanswered count response:", response.data);
      
      if (response.data && response.data.data && typeof response.data.data.countUnanswered === 'number') {
        return response.data.data.countUnanswered;
      } else {
        console.error("Некорректная структура ответа API при получении количества неотвеченных отзывов:", response.data);
        return 0;
      }
    } catch (error) {
      console.error("Feedbacks API: Error fetching unanswered count:", error);
      return 0;
    }
  }
};

/**
 * API для работы с вопросами покупателей
 */
export const QuestionsAPI = {
  // Получение списка вопросов
  getQuestions: async (params: QuestionListParams): Promise<WbQuestionsResponse> => {
    try {
      console.log("Feedbacks API: Fetching questions with params:", params);
      
      const response = await feedbacksClient.get(`/questions`, {
        params: params,
      });
      
      console.log("Feedbacks API: Questions response received:", response.data);
      return response.data;
    } catch (error) {
      console.error("Feedbacks API: Error fetching questions:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка получения вопросов: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка получения вопросов. Проверьте консоль для деталей.");
      }
      throw error;
    }
  },

  // Получение количества неотвеченных вопросов
  getUnansweredQuestionsCount: async (): Promise<number> => {
    try {
      console.log("Feedbacks API: Fetching unanswered questions count...");
      const response = await feedbacksClient.get(`/questions/count-unanswered`);
      
      console.log("Feedbacks API: Unanswered questions count response:", response.data);
      
      if (response.data && response.data.data && typeof response.data.data.count === 'number') {
        return response.data.data.count;
      } else {
        console.error("Некорректная структура ответа API при получении количества неотвеченных вопросов:", response.data);
        return 0;
      }
    } catch (error) {
      console.error("Feedbacks API: Error fetching unanswered questions count:", error);
      return 0;
    }
  },

  // Работа с вопросом (ответ, редактирование, отклонение, отметка просмотренным)
  handleQuestion: async (data: WbQuestionAnswerRequest): Promise<WbQuestionAnswerResponse> => {
    try {
      const response = await feedbacksClient.patch(`/questions`, data);
      return response.data;
    } catch (error) {
      console.error("Feedbacks API: Error handling question:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Ошибка при работе с вопросом: ${error.response.status} ${error.response.statusText}`);
      } else {
        toast.error("Ошибка при работе с вопросом. Проверьте консоль для деталей.");
      }
      throw error;
    }
  }
};
